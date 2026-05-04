import { getDb } from '../../db';
import {
	dbSchemas,
	type CreateItemInput,
	type Item,
	type ItemWithAssignee,
	type ListItemsOptions,
	type UpdateItemInput
} from './types';
import type { Db } from './utils';
import type { Sql } from 'postgres';
import { parseRow } from './utils';
import { parseRecurringConfig, calculateNextDate } from '$lib/utils/recurring';
import { getFieldValuesForItem } from './fieldValues';
import { DASHBOARD_MAX_ITEMS_PER_SECTION } from '$lib/utils/dashboard';

export async function createItem(input: CreateItemInput, sql: Db = getDb()): Promise<Item> {
	const [item] = await sql`
		INSERT INTO items (
			category_id, user_id, assigned_to_user_id, priority, deadline, time_estimate,
			recurring_config, next_show_date
		) VALUES (
			${input.category_id}, ${input.user_id}, ${input.assigned_to_user_id ?? null},
			${input.priority ?? null}, ${input.deadline ?? null}, ${input.time_estimate ?? null},
			${input.recurring_config ?? null}, ${input.next_show_date ?? null}
		) RETURNING *
	`;
	const parsed = parseRow(dbSchemas.itemSchema, item);

	if (input.field_values?.length) {
		const fvRows = input.field_values.map((fv) => ({
			item_id: parsed.id,
			field_id: fv.field_id,
			value: fv.value ?? null
		}));
		await sql`INSERT INTO field_values ${sql(fvRows)}`;
	}

	return parsed;
}

export async function getItemById(itemId: number, sql: Db = getDb()): Promise<Item | null> {
	const [row] = await sql`SELECT * FROM items WHERE id = ${itemId}`;
	if (!row) return null;
	return parseRow(dbSchemas.itemSchema, row);
}

export async function getItemWithCategoryId(
	itemId: number,
	sql: Db = getDb()
): Promise<number | null> {
	const [row] = await sql`SELECT category_id FROM items WHERE id = ${itemId}`;
	return (row?.category_id as number) ?? null;
}

export async function updateItem(
	itemId: number,
	input: UpdateItemInput,
	sql: Db = getDb()
): Promise<Item> {
	const updates: Record<string, unknown> = {};
	if (input.assigned_to_user_id !== undefined)
		updates.assigned_to_user_id = input.assigned_to_user_id;
	if (input.priority !== undefined) updates.priority = input.priority;
	if (input.deadline !== undefined) updates.deadline = input.deadline;
	if (input.time_estimate !== undefined) updates.time_estimate = input.time_estimate;
	if (input.recurring_config !== undefined) updates.recurring_config = input.recurring_config;
	if (input.completed_at !== undefined) updates.completed_at = input.completed_at;
	if (input.next_show_date !== undefined) updates.next_show_date = input.next_show_date;
	if (input.is_archived !== undefined) updates.is_archived = input.is_archived;

	if (Object.keys(updates).length > 0) {
		await sql`UPDATE items SET ${sql(updates)}, updated_at = NOW() WHERE id = ${itemId}`;
	}

	const [row] = await sql`SELECT * FROM items WHERE id = ${itemId}`;
	return parseRow(dbSchemas.itemSchema, row);
}

export async function deleteItem(itemId: number, sql: Db = getDb()): Promise<void> {
	await sql`DELETE FROM items WHERE id = ${itemId}`;
}

export async function completeItem(
	itemId: number,
	sql: Sql = getDb()
): Promise<{ completed: Item; nextOccurrence: Item | null }> {
	return sql.begin(async (tx) => {
		const item = await getItemById(itemId, tx);
		if (!item) throw new Error('Item not found');

		const completed = await updateItem(
			itemId,
			{ is_archived: true, completed_at: new Date().toISOString() },
			tx
		);

		let nextOccurrence: Item | null = null;
		if (item.recurring_config) {
			const config = parseRecurringConfig(item.recurring_config);
			if (config) {
				const nextDate = calculateNextDate(config);
				const fieldValues = await getFieldValuesForItem(itemId, tx);
				nextOccurrence = await createItem(
					{
						category_id: item.category_id,
						user_id: item.user_id,
						assigned_to_user_id: item.assigned_to_user_id,
						priority: item.priority,
						deadline: item.deadline,
						time_estimate: item.time_estimate,
						recurring_config: item.recurring_config,
						next_show_date: nextDate.toISOString(),
						field_values: fieldValues.map((fv) => ({ field_id: fv.field_id, value: fv.value }))
					},
					tx
				);
			}
		}

		return { completed, nextOccurrence };
	});
}

export async function listItemsForCategory(
	categoryId: number,
	opts: ListItemsOptions = {},
	sql: Db = getDb()
): Promise<ItemWithAssignee[]> {
	const limit = opts.limit ?? 50;
	const offset = opts.offset ?? 0;
	const archivedFilter = opts.include_archived ? sql`` : sql`AND i.is_archived = FALSE`;

	const rows = await sql`
		SELECT i.*, u.username as assigned_to_username
		FROM items i
		LEFT JOIN users u ON u.id = i.assigned_to_user_id
		WHERE i.category_id = ${categoryId}
			${archivedFilter}
			AND (i.next_show_date IS NULL OR i.next_show_date <= CURRENT_TIMESTAMP)
		ORDER BY
			CASE i.priority
				WHEN 'urgent' THEN 1
				WHEN 'high' THEN 2
				WHEN 'medium' THEN 3
				WHEN 'low' THEN 4
				ELSE 5
			END,
			i.deadline ASC NULLS LAST,
			i.created_at DESC
		LIMIT ${limit} OFFSET ${offset}
	`;
	return rows.map((r) => parseRow(dbSchemas.itemWithAssigneeSchema, r));
}

export async function listArchivedItemsForCategory(
	categoryId: number,
	opts: Pick<ListItemsOptions, 'limit' | 'offset'> = {},
	sql: Db = getDb()
): Promise<Item[]> {
	const limit = opts.limit ?? 50;
	const offset = opts.offset ?? 0;

	const rows = await sql`
		SELECT i.*
		FROM items i
		WHERE i.category_id = ${categoryId}
			AND i.is_archived = TRUE
		ORDER BY i.completed_at DESC NULLS LAST, i.created_at DESC
		LIMIT ${limit} OFFSET ${offset}
	`;
	return rows.map((r) => parseRow(dbSchemas.itemSchema, r));
}

export async function countItemsForCategory(
	categoryId: number,
	sql: Db = getDb()
): Promise<number> {
	const [row] = await sql`
		SELECT COUNT(*) as count FROM items WHERE category_id = ${categoryId} AND is_archived = FALSE
	`;
	return Number(row.count);
}

export async function listUpcomingChores(
	categoryId: number,
	daysAhead: number = 30,
	sql: Db = getDb()
): Promise<ItemWithAssignee[]> {
	const rows = await sql`
		SELECT i.*, u.username as assigned_to_username
		FROM items i
		JOIN categories c ON c.id = i.category_id
		LEFT JOIN users u ON u.id = i.assigned_to_user_id
		WHERE i.category_id = ${categoryId}
			AND c.template_type = 'chore'
			AND i.is_archived = FALSE
			AND (i.next_show_date IS NULL OR i.next_show_date <= NOW() + ${daysAhead} * INTERVAL '1 day')
		ORDER BY
			CASE WHEN i.next_show_date IS NULL THEN 1 ELSE 0 END,
			i.next_show_date ASC NULLS LAST,
			i.created_at DESC
	`;
	return rows.map((r) => parseRow(dbSchemas.itemWithAssigneeSchema, r));
}

export async function getItemsAssignedToUser(userId: number, sql: Db = getDb()): Promise<Item[]> {
	const rows = await sql`
		SELECT i.*
		FROM items i
		JOIN categories c ON c.id = i.category_id
		LEFT JOIN shared_access sa ON sa.category_id = c.id AND sa.shared_with_user_id = ${userId}
		WHERE i.assigned_to_user_id = ${userId}
			AND i.is_archived = FALSE
			AND (i.next_show_date IS NULL OR i.next_show_date <= CURRENT_TIMESTAMP)
			AND (c.user_id = ${userId} OR sa.shared_with_user_id = ${userId})
		ORDER BY
			CASE i.priority
				WHEN 'urgent' THEN 1
				WHEN 'high' THEN 2
				WHEN 'medium' THEN 3
				WHEN 'low' THEN 4
				ELSE 5
			END,
			i.deadline ASC NULLS LAST,
			i.created_at DESC
		LIMIT ${DASHBOARD_MAX_ITEMS_PER_SECTION}
	`;
	return rows.map((r) => parseRow(dbSchemas.itemSchema, r));
}

export async function getItemsDueSoon(
	userId: number,
	daysAhead: number = 7,
	sql: Db = getDb()
): Promise<Item[]> {
	const rows = await sql`
		SELECT i.*
		FROM items i
		JOIN categories c ON c.id = i.category_id
		LEFT JOIN shared_access sa ON sa.category_id = c.id AND sa.shared_with_user_id = ${userId}
		WHERE (c.user_id = ${userId} OR sa.shared_with_user_id = ${userId})
			AND i.is_archived = FALSE
			AND i.deadline IS NOT NULL
			AND i.deadline::date BETWEEN CURRENT_DATE AND CURRENT_DATE + ${daysAhead} * INTERVAL '1 day'
			AND (i.next_show_date IS NULL OR i.next_show_date <= CURRENT_TIMESTAMP)
		ORDER BY i.deadline ASC NULLS LAST
		LIMIT ${DASHBOARD_MAX_ITEMS_PER_SECTION}
	`;
	return rows.map((r) => parseRow(dbSchemas.itemSchema, r));
}

export async function getHabitsNotLoggedToday(userId: number, sql: Db = getDb()): Promise<Item[]> {
	const today = new Date().toISOString().split('T')[0];

	const rows = await sql`
		SELECT i.*
		FROM items i
		JOIN categories c ON c.id = i.category_id
		LEFT JOIN shared_access sa ON sa.category_id = c.id AND sa.shared_with_user_id = ${userId}
		LEFT JOIN habit_entries he ON he.item_id = i.id AND he.logged_date = ${today}
		WHERE c.template_type = 'habit'
			AND (c.user_id = ${userId} OR sa.shared_with_user_id = ${userId})
			AND i.is_archived = FALSE
			AND he.id IS NULL
		ORDER BY i.created_at DESC
		LIMIT ${DASHBOARD_MAX_ITEMS_PER_SECTION}
	`;
	return rows.map((r) => parseRow(dbSchemas.itemSchema, r));
}
