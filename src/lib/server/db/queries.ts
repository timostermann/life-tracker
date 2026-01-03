import type { Database as BetterSqlite3Database } from 'better-sqlite3';

import { getDb } from '../db';
import {
	categorySchema,
	habitEntrySchema,
	itemSchema,
	permissionSchema,
	templateSchema,
	userSchema
} from '$lib/schemas';
import type { Category, HabitEntry, Item, Template, User } from '$lib/schemas';
import { type z } from 'zod';

export type TemplateType = 'task' | 'chore' | 'habit';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Permission = 'view' | 'edit';
export type HabitEntryStatus = 'done' | 'skipped' | 'failed';

const sharedCategorySchema = categorySchema.extend({ permission: permissionSchema });
type SharedCategory = z.infer<typeof sharedCategorySchema>;

function parseRow<T>(schema: z.ZodType<T>, row: unknown): T {
	return schema.parse(row);
}

function parseOptionalRow<T>(schema: z.ZodType<T>, row: unknown): T | undefined {
	if (!row) return undefined;
	return schema.parse(row);
}

export function getUserById(id: number, db: BetterSqlite3Database = getDb()): User | undefined {
	const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown;
	return parseOptionalRow(userSchema, row);
}

export function getUserByUsername(
	username: string,
	db: BetterSqlite3Database = getDb()
): User | undefined {
	const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as unknown;
	return parseOptionalRow(userSchema, row);
}

export function createUser(
	input: { username: string; password_hash: string },
	db: BetterSqlite3Database = getDb()
): User {
	const res = db
		.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
		.run(input.username, input.password_hash);
	const created = getUserById(Number(res.lastInsertRowid), db);
	if (!created) throw new Error('Failed to create user');
	return created;
}

export function listTemplates(db: BetterSqlite3Database = getDb()): Template[] {
	const rows = db.prepare('SELECT * FROM templates ORDER BY id ASC').all() as unknown[];
	return rows.map((r) => parseRow(templateSchema, r));
}

export function getTemplateById(
	id: number,
	db: BetterSqlite3Database = getDb()
): Template | undefined {
	const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as unknown;
	return parseOptionalRow(templateSchema, row);
}

export function createCategory(
	input: {
		user_id: number;
		name: string;
		template_type: TemplateType;
		icon?: string | null;
		color?: string | null;
		is_private?: boolean;
	},
	db: BetterSqlite3Database = getDb()
): Category {
	const res = db
		.prepare(
			`INSERT INTO categories (user_id, name, template_type, icon, color, is_private)
       VALUES (?, ?, ?, ?, ?, ?)`
		)
		.run(
			input.user_id,
			input.name,
			input.template_type,
			input.icon ?? null,
			input.color ?? null,
			input.is_private === undefined ? 1 : input.is_private ? 1 : 0
		);

	const row = db
		.prepare('SELECT * FROM categories WHERE id = ?')
		.get(Number(res.lastInsertRowid)) as unknown;
	return parseRow(categorySchema, row);
}

export function listCategoriesOwnedByUser(
	userId: number,
	db: BetterSqlite3Database = getDb()
): Category[] {
	const rows = db
		.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY created_at DESC')
		.all(userId) as unknown[];
	return rows.map((r) => parseRow(categorySchema, r));
}

export function listCategoriesSharedWithUser(
	userId: number,
	db: BetterSqlite3Database = getDb()
): SharedCategory[] {
	const rows = db
		.prepare(
			`SELECT c.*, sa.permission
       FROM shared_access sa
       JOIN categories c ON c.id = sa.category_id
       WHERE sa.shared_with_user_id = ?
       ORDER BY c.created_at DESC`
		)
		.all(userId) as unknown[];
	return rows.map((r) => parseRow(sharedCategorySchema, r));
}

export function listCategoriesForUser(
	userId: number,
	db: BetterSqlite3Database = getDb()
): {
	owned: Category[];
	shared: SharedCategory[];
} {
	return {
		owned: listCategoriesOwnedByUser(userId, db),
		shared: listCategoriesSharedWithUser(userId, db)
	};
}

export function createFields(
	input: Array<{
		category_id: number;
		name: string;
		field_type: 'text' | 'number' | 'date' | 'boolean' | 'select';
		options?: string | null;
		field_order: number;
	}>,
	db: BetterSqlite3Database = getDb()
) {
	const stmt = db.prepare(
		`INSERT INTO fields (category_id, name, field_type, options, field_order)
     VALUES (?, ?, ?, ?, ?)`
	);
	const insertMany = db.transaction(
		(
			rows: Array<{
				category_id: number;
				name: string;
				field_type: 'text' | 'number' | 'date' | 'boolean' | 'select';
				options?: string | null;
				field_order: number;
			}>
		) => {
			for (const row of rows) {
				stmt.run(row.category_id, row.name, row.field_type, row.options ?? null, row.field_order);
			}
		}
	);
	insertMany(input);
}

export function createItem(
	input: {
		category_id: number;
		user_id: number;
		assigned_to_user_id?: number | null;
		priority?: Priority | null;
		deadline?: string | null;
		time_estimate?: number | null;
		recurring_config?: string | null;
		next_show_date?: string | null;
		field_values?: Array<{ field_id: number; value: string | null }>;
	},
	db: BetterSqlite3Database = getDb()
): Item {
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
		return parseRow(itemSchema, row);
	});

	return create();
}

export function listItemsForCategory(
	categoryId: number,
	opts: { include_archived?: boolean; limit?: number; offset?: number } = {},
	db: BetterSqlite3Database = getDb()
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

	return rows.map((r) => parseRow(itemSchema, r));
}

export function upsertHabitEntry(
	input: { item_id: number; logged_date: string; status: HabitEntryStatus; notes?: string | null },
	db: BetterSqlite3Database = getDb()
): HabitEntry {
	db.prepare(
		`INSERT INTO habit_entries (item_id, logged_date, status, notes)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(item_id, logged_date) DO UPDATE SET
       status = excluded.status,
       notes = excluded.notes`
	).run(input.item_id, input.logged_date, input.status, input.notes ?? null);

	const row = db
		.prepare('SELECT * FROM habit_entries WHERE item_id = ? AND logged_date = ?')
		.get(input.item_id, input.logged_date) as unknown;
	return parseRow(habitEntrySchema, row);
}

export function listHabitEntries(
	itemId: number,
	opts: { limit?: number; offset?: number } = {},
	db: BetterSqlite3Database = getDb()
): HabitEntry[] {
	const limit = opts.limit ?? 100;
	const offset = opts.offset ?? 0;
	const rows = db
		.prepare(
			`SELECT * FROM habit_entries
       WHERE item_id = ?
       ORDER BY logged_date DESC
       LIMIT ? OFFSET ?`
		)
		.all(itemId, limit, offset) as unknown[];

	return rows.map((r) => parseRow(habitEntrySchema, r));
}
