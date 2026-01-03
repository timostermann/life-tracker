import { getDb } from '../../db';
import { dbSchemas, type CreateItemInput, type Item, type ListItemsOptions } from './types';
import type { Db } from './utils';
import { parseRow } from './utils';

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

		const row = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId) as unknown;
		return parseRow(dbSchemas.itemSchema, row);
	});

	return create();
}

export function listItemsForCategory(
	categoryId: number,
	opts: ListItemsOptions = {},
	db: Db = getDb()
): Item[] {
	const limit = opts.limit ?? 50;
	const offset = opts.offset ?? 0;

	const whereArchived = opts.include_archived ? '' : 'AND i.is_archived = 0';

	const rows = db
		.prepare(
			`SELECT i.*
       FROM items i
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
		.all(categoryId, limit, offset) as unknown[];

	return rows.map((r) => parseRow(dbSchemas.itemSchema, r));
}
