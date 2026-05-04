import { getDb } from '../../db';
import {
	dbSchemas,
	sharedCategorySchema,
	type CreateCategoryInput,
	type UpdateCategoryInput,
	type Category,
	type SharedCategory,
	type Permission
} from './types';
import type { Db } from './utils';
import { parseRow } from './utils';
import { z } from 'zod';

export async function getCategoryById(
	categoryId: number,
	sql: Db = getDb()
): Promise<Category | null> {
	const [row] = await sql`SELECT * FROM categories WHERE id = ${categoryId}`;
	if (!row) return null;
	return parseRow(dbSchemas.categorySchema, row);
}

export async function createCategory(
	input: CreateCategoryInput,
	sql: Db = getDb()
): Promise<Category> {
	const [row] = await sql`
		INSERT INTO categories (user_id, name, template_type, icon, color, is_private)
		VALUES (${input.user_id}, ${input.name}, ${input.template_type}, ${input.icon ?? null}, ${input.color ?? null}, ${input.is_private ?? true})
		RETURNING *
	`;
	return parseRow(dbSchemas.categorySchema, row);
}

export async function updateCategory(
	categoryId: number,
	input: UpdateCategoryInput,
	sql: Db = getDb()
): Promise<Category> {
	const updates: Record<string, unknown> = {};
	if (input.name !== undefined) updates.name = input.name;
	if (input.icon !== undefined) updates.icon = input.icon;
	if (input.color !== undefined) updates.color = input.color;
	if (input.is_private !== undefined) updates.is_private = input.is_private;

	if (Object.keys(updates).length > 0) {
		await sql`UPDATE categories SET ${sql(updates)}, updated_at = NOW() WHERE id = ${categoryId}`;
	}

	const [row] = await sql`SELECT * FROM categories WHERE id = ${categoryId}`;
	return parseRow(dbSchemas.categorySchema, row);
}

export async function deleteCategory(categoryId: number, sql: Db = getDb()): Promise<void> {
	await sql`DELETE FROM categories WHERE id = ${categoryId}`;
}

export async function listCategoriesOwnedByUser(
	userId: number,
	sql: Db = getDb()
): Promise<Category[]> {
	const rows =
		await sql`SELECT * FROM categories WHERE user_id = ${userId} ORDER BY created_at DESC`;
	return rows.map((r) => parseRow(dbSchemas.categorySchema, r));
}

export async function listCategoriesSharedWithUser(
	userId: number,
	sql: Db = getDb()
): Promise<SharedCategory[]> {
	const rows = await sql`
		SELECT c.*, sa.permission
		FROM shared_access sa
		JOIN categories c ON c.id = sa.category_id
		WHERE sa.shared_with_user_id = ${userId}
		ORDER BY c.created_at DESC
	`;
	return rows.map((r) => parseRow(sharedCategorySchema, r));
}

export async function listCategoriesForUser(
	userId: number,
	sql: Db = getDb()
): Promise<{ owned: Category[]; shared: SharedCategory[] }> {
	const [owned, shared] = await Promise.all([
		listCategoriesOwnedByUser(userId, sql),
		listCategoriesSharedWithUser(userId, sql)
	]);
	return { owned, shared };
}

const categoryShareSchema = z.object({
	user_id: z.number().int().positive(),
	username: z.string().min(1),
	permission: dbSchemas.permissionSchema
});

export type CategoryShare = z.infer<typeof categoryShareSchema>;

export async function listCategoryShares(
	categoryId: number,
	sql: Db = getDb()
): Promise<CategoryShare[]> {
	const rows = await sql`
		SELECT sa.shared_with_user_id AS user_id, u.username, sa.permission
		FROM shared_access sa
		JOIN users u ON u.id = sa.shared_with_user_id
		WHERE sa.category_id = ${categoryId}
		ORDER BY u.username ASC
	`;
	return rows.map((r) => parseRow(categoryShareSchema, r));
}

export async function getSharePermissionForUser(
	categoryId: number,
	userId: number,
	sql: Db = getDb()
): Promise<Permission | null> {
	const [row] = await sql`
		SELECT permission FROM shared_access WHERE category_id = ${categoryId} AND shared_with_user_id = ${userId}
	`;
	if (!row) return null;
	const parsed = dbSchemas.permissionSchema.safeParse(row.permission);
	return parsed.success ? parsed.data : null;
}

export async function checkCategoryAccess(
	userId: number,
	categoryId: number,
	requiredPermission: Permission,
	sql: Db = getDb()
): Promise<boolean> {
	const category = await getCategoryById(categoryId, sql);
	if (!category) return false;
	if (category.user_id === userId) return true;

	const permission = await getSharePermissionForUser(categoryId, userId, sql);
	if (!permission) return false;
	if (requiredPermission === 'view') return true;
	return permission === 'edit';
}

export async function shareCategory(
	categoryId: number,
	sharedWithUserId: number,
	permission: Permission,
	sql: Db = getDb()
): Promise<void> {
	await sql`
		INSERT INTO shared_access (category_id, shared_with_user_id, permission)
		VALUES (${categoryId}, ${sharedWithUserId}, ${permission})
	`;
}

export async function revokeCategoryShare(
	categoryId: number,
	sharedWithUserId: number,
	sql: Db = getDb()
): Promise<void> {
	await sql`DELETE FROM shared_access WHERE category_id = ${categoryId} AND shared_with_user_id = ${sharedWithUserId}`;
}

const categoryWithCountSchema = dbSchemas.categorySchema.extend({
	item_count: z.number().int().nonnegative()
});

export type CategoryWithCount = z.infer<typeof categoryWithCountSchema>;

export async function getRecentCategoriesWithCounts(
	userId: number,
	limit: number = 6,
	sql: Db = getDb()
): Promise<CategoryWithCount[]> {
	const ownedRows = await sql`
		SELECT c.*, COUNT(i.id) as item_count
		FROM categories c
		LEFT JOIN items i ON i.category_id = c.id AND i.is_archived = FALSE
		WHERE c.user_id = ${userId}
		GROUP BY c.id
		ORDER BY c.updated_at DESC
		LIMIT ${limit}
	`;
	const owned = ownedRows.map((r) => parseRow(categoryWithCountSchema, r));

	const sharedRows = await sql`
		SELECT c.*, COUNT(i.id) as item_count
		FROM shared_access sa
		JOIN categories c ON c.id = sa.category_id
		LEFT JOIN items i ON i.category_id = c.id AND i.is_archived = FALSE
		WHERE sa.shared_with_user_id = ${userId}
		GROUP BY c.id
		ORDER BY c.updated_at DESC
	`;
	const shared = sharedRows.map((r) => parseRow(categoryWithCountSchema, r));

	return [...owned, ...shared]
		.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
		.slice(0, limit);
}
