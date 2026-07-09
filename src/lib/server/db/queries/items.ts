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
import { parseRow, buildSqlUpdates, buildBooleanSqlUpdate } from './utils';
import { parseRecurringConfig, calculateNextDate } from '$lib/utils/recurring';
import { getFieldValuesForItem } from './fieldValues';
import { DASHBOARD_MAX_ITEMS_PER_SECTION } from '$lib/utils/dashboard';

export function createItem(input: CreateItemInput, db: Db = getDb()): Item {
	const create = db.transaction(() => {
		const res = db
			.prepare(
				`INSERT INTO items (
          category_id, user_id, assigned_to_user_id, priority, deadline, time_estimate,
          recurring_config, next_show_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.run(
				input.category_id,
				input.user_id,
				input.assigned_to_user_id ?? null,
				input.priority ?? null,
				input.deadline ?? null,
				input.time_estimate ?? null,
				input.recurring_config ?? null,
				input.next_show_date ?? null
			);

		const itemId = Number(res.lastInsertRowid);
		if (input.field_values?.length) {
			const fvStmt = db.prepare(
				'INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)'
			);
			for (const fv of input.field_values) fvStmt.run(itemId, fv.field_id, fv.value ?? null);
		}

		const row = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
		return parseRow(dbSchemas.itemSchema, row);
	});

	return create();
}

export function getItemById(itemId: number, db: Db = getDb()): Item | null {
	const row = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
	if (!row) return null;
	return parseRow(dbSchemas.itemSchema, row);
}

export function getItemWithCategoryId(itemId: number, db: Db = getDb()): number | null {
	const row = db.prepare('SELECT category_id FROM items WHERE id = ?').get(itemId) as
		| { category_id: number }
		| undefined;
	return row?.category_id ?? null;
}

export function updateItem(itemId: number, input: UpdateItemInput, db: Db = getDb()): Item {
	const sqlUpdates = buildSqlUpdates({
		assigned_to_user_id: input.assigned_to_user_id,
		priority: input.priority,
		deadline: input.deadline,
		time_estimate: input.time_estimate,
		recurring_config: input.recurring_config,
		completed_at: input.completed_at,
		next_show_date: input.next_show_date
	});

	const boolUpdate = buildBooleanSqlUpdate('is_archived', input.is_archived);
	if (boolUpdate) {
		sqlUpdates.updates.push(boolUpdate.update);
		sqlUpdates.values.push(boolUpdate.value);
	}

	if (sqlUpdates.updates.length > 0) {
		sqlUpdates.updates.push('updated_at = CURRENT_TIMESTAMP');
		sqlUpdates.values.push(itemId);
		db.prepare(`UPDATE items SET ${sqlUpdates.updates.join(', ')} WHERE id = ?`).run(
			...sqlUpdates.values
		);
	}

	const row = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
	return parseRow(dbSchemas.itemSchema, row);
}

export function deleteItem(itemId: number, db: Db = getDb()): void {
	db.prepare('DELETE FROM items WHERE id = ?').run(itemId);
}

export function completeItem(
	itemId: number,
	db: Db = getDb()
): { completed: Item; nextOccurrence: Item | null } {
	const complete = db.transaction(() => {
		const item = getItemById(itemId, db);
		if (!item) {
			throw new Error('Item not found');
		}

		const completed = updateItem(
			itemId,
			{
				is_archived: true,
				completed_at: new Date().toISOString()
			},
			db
		);

		let nextOccurrence: Item | null = null;
		if (item.recurring_config) {
			const config = parseRecurringConfig(item.recurring_config);

			if (config) {
				const nextDate = calculateNextDate(config);
				const fieldValues = getFieldValuesForItem(itemId, db);

				nextOccurrence = createItem(
					{
						category_id: item.category_id,
						user_id: item.user_id,
						assigned_to_user_id: item.assigned_to_user_id,
						priority: item.priority,
						deadline: item.deadline,
						time_estimate: item.time_estimate,
						recurring_config: item.recurring_config,
						next_show_date: nextDate.toISOString(),
						field_values: fieldValues.map((fv) => ({
							field_id: fv.field_id,
							value: fv.value
						}))
					},
					db
				);
			}
		}

		return { completed, nextOccurrence };
	});

	return complete();
}

export function listItemsForCategory(
	categoryId: number,
	opts: ListItemsOptions = {},
	db: Db = getDb()
): ItemWithAssignee[] {
	const limit = opts.limit ?? 50;
	const offset = opts.offset ?? 0;

	const whereArchived = opts.include_archived ? '' : 'AND i.is_archived = 0';

	const rows = db
		.prepare(
			`SELECT i.*, u.username as assigned_to_username
      FROM items i
      LEFT JOIN users u ON u.id = i.assigned_to_user_id
      WHERE i.category_id = ?
        ${whereArchived}
        AND (i.next_show_date IS NULL OR i.next_show_date <= CURRENT_TIMESTAMP)
      ORDER BY
        CASE i.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        i.deadline ASC,
        i.created_at DESC
      LIMIT ? OFFSET ?`
		)
		.all(categoryId, limit, offset);

	return rows.map((r) => parseRow(dbSchemas.itemWithAssigneeSchema, r));
}

export function listArchivedItemsForCategory(
	categoryId: number,
	opts: Pick<ListItemsOptions, 'limit' | 'offset'> = {},
	db: Db = getDb()
): Item[] {
	const limit = opts.limit ?? 50;
	const offset = opts.offset ?? 0;

	const rows = db
		.prepare(
			`SELECT i.*
      FROM items i
      WHERE i.category_id = ?
        AND i.is_archived = 1
      ORDER BY i.completed_at DESC, i.created_at DESC
      LIMIT ? OFFSET ?`
		)
		.all(categoryId, limit, offset);

	return rows.map((r) => parseRow(dbSchemas.itemSchema, r));
}

export function countItemsForCategory(categoryId: number, db: Db = getDb()): number {
	const row = db
		.prepare('SELECT COUNT(*) as count FROM items WHERE category_id = ? AND is_archived = 0')
		.get(categoryId) as { count: number };
	return row.count;
}

export function listUpcomingChores(
	categoryId: number,
	daysAhead: number = 30,
	db: Db = getDb()
): ItemWithAssignee[] {
	const rows = db
		.prepare(
			`SELECT i.*, u.username as assigned_to_username
      FROM items i
      JOIN categories c ON c.id = i.category_id
      LEFT JOIN users u ON u.id = i.assigned_to_user_id
      WHERE i.category_id = ?
        AND c.template_type = 'chore'
        AND i.is_archived = 0
        AND (i.next_show_date IS NULL OR i.next_show_date BETWEEN CURRENT_DATE AND DATE(CURRENT_DATE, '+' || ? || ' days'))
      ORDER BY 
        CASE 
          WHEN i.next_show_date IS NULL THEN 1
          ELSE 0
        END,
        i.next_show_date ASC,
        i.created_at DESC`
		)
		.all(categoryId, daysAhead);

	return rows.map((r) => parseRow(dbSchemas.itemWithAssigneeSchema, r));
}

export function getItemsAssignedToUser(userId: number, db: Db = getDb()): Item[] {
	const rows = db
		.prepare(
			`SELECT i.*
      FROM items i
      JOIN categories c ON c.id = i.category_id
      LEFT JOIN shared_access sa ON sa.category_id = c.id AND sa.shared_with_user_id = ?
      WHERE i.assigned_to_user_id = ?
        AND i.is_archived = 0
        AND (i.next_show_date IS NULL OR i.next_show_date <= CURRENT_TIMESTAMP)
        AND (c.user_id = ? OR sa.shared_with_user_id = ?)
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
      LIMIT ?`
		)
		.all(userId, userId, userId, userId, DASHBOARD_MAX_ITEMS_PER_SECTION);

	return rows.map((r) => parseRow(dbSchemas.itemSchema, r));
}

export function getItemsDueSoon(userId: number, daysAhead: number = 7, db: Db = getDb()): Item[] {
	const rows = db
		.prepare(
			`SELECT i.*
      FROM items i
      JOIN categories c ON c.id = i.category_id
      LEFT JOIN shared_access sa ON sa.category_id = c.id AND sa.shared_with_user_id = ?
      WHERE (c.user_id = ? OR sa.shared_with_user_id = ?)
        AND i.is_archived = 0
        AND i.deadline IS NOT NULL
        AND DATE(i.deadline) BETWEEN DATE('now') AND DATE('now', '+' || ? || ' days')
        AND (i.next_show_date IS NULL OR i.next_show_date <= CURRENT_TIMESTAMP)
      ORDER BY i.deadline ASC
      LIMIT ?`
		)
		.all(userId, userId, userId, daysAhead, DASHBOARD_MAX_ITEMS_PER_SECTION);

	return rows.map((r) => parseRow(dbSchemas.itemSchema, r));
}

export function getHabitsNotLoggedToday(userId: number, db: Db = getDb()): Item[] {
	const today = new Date().toISOString().split('T')[0];

	const rows = db
		.prepare(
			`SELECT i.*
      FROM items i
      JOIN categories c ON c.id = i.category_id
      LEFT JOIN shared_access sa ON sa.category_id = c.id AND sa.shared_with_user_id = ?
      LEFT JOIN habit_entries he ON he.item_id = i.id AND he.logged_date = ?
      WHERE c.template_type = 'habit'
        AND (c.user_id = ? OR sa.shared_with_user_id = ?)
        AND i.is_archived = 0
        AND he.id IS NULL
      ORDER BY i.created_at DESC
      LIMIT ?`
		)
		.all(userId, today, userId, userId, DASHBOARD_MAX_ITEMS_PER_SECTION);

	return rows.map((r) => parseRow(dbSchemas.itemSchema, r));
}
