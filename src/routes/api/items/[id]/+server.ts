import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateItemSchema, updateChoreSchema } from '$lib/schemas/items';
import {
	getItemById,
	getCategoryById,
	checkCategoryAccess,
	updateItem,
	deleteItem,
	getFieldValuesAsRecord,
	upsertFieldValues
} from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';
import type { Db } from '$lib/server/db/queries/utils';
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

	const db = (locals as { db?: Db }).db ?? getDb();

	const item = getItemById(itemId, db);
	if (!item) {
		return json({ error: 'Item not found' }, { status: 404 });
	}

	const canView = checkCategoryAccess(user.id, item.category_id, 'view', db);
	if (!canView) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const enrichedItem = {
		...item,
		values: getFieldValuesAsRecord(item.id, db),
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

	const db = (locals as { db?: Db }).db ?? getDb();

	const item = getItemById(itemId, db);
	if (!item) {
		return json({ error: 'Item not found' }, { status: 404 });
	}

	const canEdit = checkCategoryAccess(user.id, item.category_id, 'edit', db);
	if (!canEdit) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const category = getCategoryById(item.category_id, db);
	if (!category) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const schema = category.template_type === 'chore' ? updateChoreSchema : updateItemSchema;
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

	if (category.template_type === 'chore' && !parsed.data.recurring_config) {
		return json(
			{
				error: 'Chores must have a recurring schedule',
				toast: 'error',
				message: 'Please configure a recurring schedule for this chore'
			},
			{ status: 400 }
		);
	}

	const { values, recurring_config, ...itemData } = parsed.data;

	const updateItemTransaction = db.transaction(() => {
		const isChore = category.template_type === 'chore';
		const updateData: Parameters<typeof updateItem>[1] = {
			...(isChore
				? {}
				: {
						priority: 'priority' in itemData ? itemData.priority : undefined,
						deadline: 'deadline' in itemData ? itemData.deadline : undefined,
						time_estimate: 'time_estimate' in itemData ? itemData.time_estimate : undefined
					}),
			assigned_to_user_id: itemData.assigned_to_user_id,
			is_archived: itemData.is_archived,
			completed_at: itemData.completed_at,
			next_show_date: itemData.next_show_date,
			recurring_config:
				recurring_config !== undefined ? stringifyRecurringConfig(recurring_config) : undefined
		};

		const updated = updateItem(itemId, updateData, db);

		if (values !== undefined) {
			upsertFieldValues(itemId, values, db);
		}

		return updated;
	});

	const updatedItem = updateItemTransaction();

	const enrichedItem = {
		...updatedItem,
		values: getFieldValuesAsRecord(updatedItem.id, db),
		recurring_config: parseRecurringConfig(updatedItem.recurring_config)
	};

	const itemType = category.template_type === 'chore' ? 'Chore' : 'Task';
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

	const db = (locals as { db?: Db }).db ?? getDb();

	const item = getItemById(itemId, db);
	if (!item) {
		return json({ error: 'Item not found' }, { status: 404 });
	}

	const canEdit = checkCategoryAccess(user.id, item.category_id, 'edit', db);
	if (!canEdit) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	deleteItem(itemId, db);

	return json({
		toast: 'success',
		message: 'Item deleted successfully'
	});
};
