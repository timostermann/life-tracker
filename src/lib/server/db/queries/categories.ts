import { getDb } from '../../db';
import {
	dbSchemas,
	sharedCategorySchema,
	type CreateCategoryInput,
	type UpdateCategoryInput,
	type Category,
	type SharedCategory
} from './types';
import type { Db } from './utils';
import { parseRow, buildSqlUpdates, buildBooleanSqlUpdate } from './utils';

export function getCategoryById(categoryId: number, db: Db = getDb()): Category | null {
	const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);
	if (!row) return null;
	return parseRow(dbSchemas.categorySchema, row);
}

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

	const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(res.lastInsertRowid));
	return parseRow(dbSchemas.categorySchema, row);
}

export function updateCategory(
	categoryId: number,
	input: UpdateCategoryInput,
	db: Db = getDb()
): Category {
	const sqlUpdates = buildSqlUpdates({
		name: input.name,
		icon: input.icon,
		color: input.color
	});

	const boolUpdate = buildBooleanSqlUpdate('is_private', input.is_private);
	if (boolUpdate) {
		sqlUpdates.updates.push(boolUpdate.update);
		sqlUpdates.values.push(boolUpdate.value);
	}

	if (sqlUpdates.updates.length > 0) {
		sqlUpdates.updates.push('updated_at = CURRENT_TIMESTAMP');
		sqlUpdates.values.push(categoryId);
		db.prepare(`UPDATE categories SET ${sqlUpdates.updates.join(', ')} WHERE id = ?`).run(
			...sqlUpdates.values
		);
	}

	const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);
	return parseRow(dbSchemas.categorySchema, row);
}

export function deleteCategory(categoryId: number, db: Db = getDb()): void {
	db.prepare('DELETE FROM categories WHERE id = ?').run(categoryId);
}

export function listCategoriesOwnedByUser(userId: number, db: Db = getDb()): Category[] {
	const rows = db
		.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY created_at DESC')
		.all(userId);
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
		.all(userId);
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
