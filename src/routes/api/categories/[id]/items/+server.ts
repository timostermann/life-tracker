import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createItemSchema, createChoreSchema, listItemsQuerySchema } from '$lib/schemas/items';
import {
	getCategoryById,
	checkCategoryAccess,
	createItem,
	listItemsForCategory,
	getFieldValuesAsRecord
} from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';
import type { Db } from '$lib/server/db/queries/utils';
import { stringifyRecurringConfig, parseRecurringConfig } from '$lib/utils/recurring';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const categoryId = Number(params.id);
	if (isNaN(categoryId)) {
		return json({ error: 'Invalid category ID' }, { status: 400 });
	}

	const db = (locals as { db?: Db }).db ?? getDb();

	const category = getCategoryById(categoryId, db);
	if (!category) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	const canView = checkCategoryAccess(user.id, categoryId, 'view', db);
	if (!canView) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const queryParams = Object.fromEntries(url.searchParams.entries());
	const parsed = listItemsQuerySchema.safeParse(queryParams);

	if (!parsed.success) {
		return json(
			{
				error: 'Invalid query parameters',
				issues: parsed.error.flatten(),
				toast: 'error'
			},
			{ status: 400 }
		);
	}

	const { limit, offset, include_archived, priority, assigned_to_user_id } = parsed.data;

	let items = listItemsForCategory(categoryId, { limit, offset, include_archived }, db);

	if (priority) {
		items = items.filter((item) => item.priority === priority);
	}
	if (assigned_to_user_id) {
		items = items.filter((item) => item.assigned_to_user_id === assigned_to_user_id);
	}

	const enrichedItems = items.map((item) => ({
		...item,
		values: getFieldValuesAsRecord(item.id, db),
		recurring_config: parseRecurringConfig(item.recurring_config)
	}));

	return json({
		items: enrichedItems,
		limit,
		offset,
		count: enrichedItems.length
	});
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const categoryId = Number(params.id);
	if (isNaN(categoryId)) {
		return json({ error: 'Invalid category ID' }, { status: 400 });
	}

	const db = (locals as { db?: Db }).db ?? getDb();

	const category = getCategoryById(categoryId, db);
	if (!category) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	const canEdit = checkCategoryAccess(user.id, categoryId, 'edit', db);
	if (!canEdit) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const schema = category.template_type === 'chore' ? createChoreSchema : createItemSchema;
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

	const createItemTransaction = db.transaction(() => {
		const fieldValues = Object.entries(values).map(([fieldId, value]) => ({
			field_id: Number(fieldId),
			value
		}));

		const isChore = category.template_type === 'chore';
		const itemInput: Parameters<typeof createItem>[0] = {
			category_id: categoryId,
			user_id: user.id,
			assigned_to_user_id: itemData.assigned_to_user_id ?? null,
			priority: isChore ? null : 'priority' in itemData ? (itemData.priority ?? null) : null,
			deadline: isChore ? null : 'deadline' in itemData ? (itemData.deadline ?? null) : null,
			time_estimate: isChore
				? null
				: 'time_estimate' in itemData
					? (itemData.time_estimate ?? null)
					: null,
			recurring_config: stringifyRecurringConfig(recurring_config ?? null),
			next_show_date: null,
			field_values: fieldValues
		};

		const item = createItem(itemInput, db);

		return item;
	});

	const item = createItemTransaction();

	const enrichedItem = {
		...item,
		values: getFieldValuesAsRecord(item.id, db)
	};

	const itemType = category.template_type === 'chore' ? 'Chore' : 'Task';
	return json(
		{
			item: enrichedItem,
			toast: 'success',
			message: `${itemType} created successfully`
		},
		{ status: 201 }
	);
};
