import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateItemSchema, updateChoreSchema } from '$lib/schemas/items';
import { updateHabitSchema } from '$lib/schemas/habits';
import {
	getItemById,
	getCategoryById,
	checkCategoryAccess,
	updateItem,
	deleteItem,
	getFieldValuesAsRecord,
	upsertFieldValues,
	listFieldsForCategory
} from '$lib/server/db/queries';
import { resolveCategoryFieldValues } from '$lib/server/api/resolveCategoryFieldValues';
import { getDb } from '$lib/server/db';
import { stringifyRecurringConfig, parseRecurringConfig } from '$lib/utils/recurring';

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const itemId = Number(params.id);
	if (isNaN(itemId)) {
		return json({ error: 'Invalid item ID' }, { status: 400 });
	}

	const sql = getDb();

	const item = await getItemById(itemId, sql);
	if (!item) {
		return json({ error: 'Item not found' }, { status: 404 });
	}

	const canView = await checkCategoryAccess(user.id, item.category_id, 'view', sql);
	if (!canView) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const enrichedItem = {
		...item,
		values: await getFieldValuesAsRecord(item.id, sql),
		recurring_config: parseRecurringConfig(item.recurring_config)
	};

	return json({ item: enrichedItem });
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const itemId = Number(params.id);
	if (isNaN(itemId)) {
		return json({ error: 'Invalid item ID' }, { status: 400 });
	}

	const sql = getDb();

	const item = await getItemById(itemId, sql);
	if (!item) {
		return json({ error: 'Item not found' }, { status: 404 });
	}

	const canEdit = await checkCategoryAccess(user.id, item.category_id, 'edit', sql);
	if (!canEdit) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const category = await getCategoryById(item.category_id, sql);
	if (!category) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const schema =
		category.template_type === 'chore'
			? updateChoreSchema
			: category.template_type === 'habit'
				? updateHabitSchema
				: updateItemSchema;
	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return json(
			{
				error: 'Invalid input',
				issues: parsed.error.flatten(),
				toast: 'error',
				message: 'Please check your input and try again'
			},
			{ status: 400 }
		);
	}

	if (
		category.template_type === 'chore' &&
		'recurring_config' in parsed.data &&
		!parsed.data.recurring_config
	) {
		return json(
			{
				error: 'Chores must have a recurring schedule',
				toast: 'error',
				message: 'Please configure a recurring schedule for this chore'
			},
			{ status: 400 }
		);
	}

	const { values, ...restData } = parsed.data;
	let recurring_config:
		| { frequency: 'daily' | 'weekly' | 'monthly'; interval: number }
		| undefined = undefined;
	if (category.template_type !== 'habit' && 'recurring_config' in restData) {
		const rc = restData.recurring_config;
		if (
			rc &&
			typeof rc === 'object' &&
			'frequency' in rc &&
			'interval' in rc &&
			typeof rc.interval === 'number'
		) {
			recurring_config = rc as { frequency: 'daily' | 'weekly' | 'monthly'; interval: number };
		}
	}
	const itemData =
		category.template_type === 'habit'
			? {}
			: 'assigned_to_user_id' in restData ||
				  'is_archived' in restData ||
				  'priority' in restData ||
				  'deadline' in restData ||
				  'time_estimate' in restData
				? restData
				: {};

	let valuesForUpsert: Record<string, string> | undefined;
	if (values !== undefined) {
		const categoryFields = await listFieldsForCategory(item.category_id, sql);
		const resolvedFieldValues = resolveCategoryFieldValues(values, categoryFields);
		if (!resolvedFieldValues.ok) {
			const err = resolvedFieldValues.error;
			return json(
				{
					error: err.code === 'unknown_field' ? 'Unknown field' : 'Ambiguous field',
					message: err.message,
					...(err.code === 'unknown_field' ? { keys: err.keys } : { field_order: err.field_order }),
					toast: 'error'
				},
				{ status: 400 }
			);
		}
		valuesForUpsert = resolvedFieldValues.resolved;
	}

	const updatedItem = await sql.begin(async (tx) => {
		const isChore = category.template_type === 'chore';
		const isHabit = category.template_type === 'habit';
		const updateData: Parameters<typeof updateItem>[1] = {
			...(isChore || isHabit
				? {}
				: {
						priority:
							'priority' in itemData
								? (itemData.priority as 'urgent' | 'high' | 'medium' | 'low' | null)
								: undefined,
						deadline: 'deadline' in itemData ? (itemData.deadline as string | null) : undefined,
						time_estimate:
							'time_estimate' in itemData ? (itemData.time_estimate as number | null) : undefined
					}),
			assigned_to_user_id: isHabit
				? undefined
				: 'assigned_to_user_id' in itemData
					? (itemData.assigned_to_user_id as number | null)
					: undefined,
			is_archived:
				'is_archived' in itemData && typeof itemData.is_archived === 'boolean'
					? itemData.is_archived
					: undefined,
			completed_at:
				'completed_at' in itemData ? (itemData.completed_at as string | null) : undefined,
			next_show_date:
				'next_show_date' in itemData ? (itemData.next_show_date as string | null) : undefined,
			recurring_config: isHabit
				? undefined
				: recurring_config
					? stringifyRecurringConfig(recurring_config)
					: undefined
		};

		const updated = await updateItem(itemId, updateData, tx);

		if (valuesForUpsert !== undefined) {
			await upsertFieldValues(itemId, valuesForUpsert, tx);
		}

		return updated;
	});

	const enrichedItem = {
		...updatedItem,
		values: await getFieldValuesAsRecord(updatedItem.id, sql),
		recurring_config: parseRecurringConfig(updatedItem.recurring_config)
	};

	const itemType =
		category.template_type === 'chore'
			? 'Chore'
			: category.template_type === 'habit'
				? 'Habit'
				: 'Task';
	return json({
		item: enrichedItem,
		toast: 'success',
		message: `${itemType} updated successfully`
	});
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const itemId = Number(params.id);
	if (isNaN(itemId)) {
		return json({ error: 'Invalid item ID' }, { status: 400 });
	}

	const sql = getDb();

	const item = await getItemById(itemId, sql);
	if (!item) {
		return json({ error: 'Item not found' }, { status: 404 });
	}

	const canEdit = await checkCategoryAccess(user.id, item.category_id, 'edit', sql);
	if (!canEdit) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	await deleteItem(itemId, sql);

	return json({
		toast: 'success',
		message: 'Item deleted successfully'
	});
};
