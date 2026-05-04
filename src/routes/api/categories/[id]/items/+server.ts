import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createItemSchema, createChoreSchema, listItemsQuerySchema } from '$lib/schemas/items';
import { createHabitSchema } from '$lib/schemas/habits';
import {
	getCategoryById,
	checkCategoryAccess,
	createItem,
	listItemsForCategory,
	getFieldValuesAsRecord,
	listFieldsForCategory
} from '$lib/server/db/queries';
import { resolveCategoryFieldValues } from '$lib/server/api/resolveCategoryFieldValues';
import { getDb } from '$lib/server/db';
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

	const sql = getDb();

	const category = await getCategoryById(categoryId, sql);
	if (!category) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	const canView = await checkCategoryAccess(user.id, categoryId, 'view', sql);
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

	let items = await listItemsForCategory(categoryId, { limit, offset, include_archived }, sql);

	if (priority) {
		items = items.filter((item) => item.priority === priority);
	}
	if (assigned_to_user_id) {
		items = items.filter((item) => item.assigned_to_user_id === assigned_to_user_id);
	}

	const enrichedItems = await Promise.all(
		items.map(async (item) => ({
			...item,
			values: await getFieldValuesAsRecord(item.id, sql),
			recurring_config: parseRecurringConfig(item.recurring_config)
		}))
	);

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

	const sql = getDb();

	const category = await getCategoryById(categoryId, sql);
	if (!category) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	const canEdit = await checkCategoryAccess(user.id, categoryId, 'edit', sql);
	if (!canEdit) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const schema =
		category.template_type === 'chore'
			? createChoreSchema
			: category.template_type === 'habit'
				? createHabitSchema
				: createItemSchema;
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
			: 'assigned_to_user_id' in restData || 'priority' in restData
				? restData
				: {};

	const categoryFields = await listFieldsForCategory(categoryId, sql);
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

	const fieldValues = Object.entries(resolvedFieldValues.resolved).map(([fieldId, value]) => ({
		field_id: Number(fieldId),
		value
	}));

	const isChore = category.template_type === 'chore';
	const isHabit = category.template_type === 'habit';

	let assignedTo: number | null = null;
	if (
		!isHabit &&
		'assigned_to_user_id' in itemData &&
		typeof itemData.assigned_to_user_id === 'number'
	) {
		assignedTo = itemData.assigned_to_user_id;
	}

	let priority: 'urgent' | 'high' | 'medium' | 'low' | null = null;
	if (!isChore && !isHabit && 'priority' in itemData) {
		const p = itemData.priority;
		if (p === 'urgent' || p === 'high' || p === 'medium' || p === 'low') {
			priority = p;
		}
	}

	let deadline: string | null = null;
	if (!isChore && !isHabit && 'deadline' in itemData && typeof itemData.deadline === 'string') {
		deadline = itemData.deadline;
	}

	let timeEstimate: number | null = null;
	if (
		!isChore &&
		!isHabit &&
		'time_estimate' in itemData &&
		typeof itemData.time_estimate === 'number'
	) {
		timeEstimate = itemData.time_estimate;
	}

	const itemInput: Parameters<typeof createItem>[0] = {
		category_id: categoryId,
		user_id: user.id,
		assigned_to_user_id: assignedTo,
		priority,
		deadline,
		time_estimate: timeEstimate,
		recurring_config: isHabit
			? null
			: recurring_config
				? stringifyRecurringConfig(recurring_config)
				: null,
		next_show_date: null,
		field_values: fieldValues
	};

	// createItem manages its own transaction internally
	const item = await createItem(itemInput, sql);

	const enrichedItem = {
		...item,
		values: await getFieldValuesAsRecord(item.id, sql)
	};

	const itemType =
		category.template_type === 'chore'
			? 'Chore'
			: category.template_type === 'habit'
				? 'Habit'
				: 'Task';
	return json(
		{
			item: enrichedItem,
			toast: 'success',
			message: `${itemType} created successfully`
		},
		{ status: 201 }
	);
};
