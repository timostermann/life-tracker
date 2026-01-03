import { getDb } from '../../db';
import {
	dbSchemas,
	sharedCategorySchema,
	type CreateCategoryInput,
	type Category,
	type SharedCategory
} from './types';
import type { Db } from './utils';
import { parseRow } from './utils';

export function createCategory(input: CreateCategoryInput, db: Db = getDb()): Category {
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
	return parseRow(dbSchemas.categorySchema, row);
}

export function listCategoriesOwnedByUser(userId: number, db: Db = getDb()): Category[] {
	const rows = db
		.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY created_at DESC')
		.all(userId) as unknown[];
	return rows.map((r) => parseRow(dbSchemas.categorySchema, r));
}

export function listCategoriesSharedWithUser(userId: number, db: Db = getDb()): SharedCategory[] {
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
	db: Db = getDb()
): {
	owned: Category[];
	shared: SharedCategory[];
} {
	return {
		owned: listCategoriesOwnedByUser(userId, db),
		shared: listCategoriesSharedWithUser(userId, db)
	};
}
