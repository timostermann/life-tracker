import { getDb } from '../../db';
import { dbSchemas, type CreateUserInput, type User } from './types';
import type { Db } from './utils';
import { parseOptionalRow, parseRow } from './utils';

export async function getUserById(id: number, sql: Db = getDb()): Promise<User | undefined> {
	const [row] = await sql`SELECT * FROM users WHERE id = ${id}`;
	return parseOptionalRow(dbSchemas.userSchema, row);
}

export async function getUserByUsername(
	username: string,
	sql: Db = getDb()
): Promise<User | undefined> {
	const [row] = await sql`SELECT * FROM users WHERE username = ${username}`;
	return parseOptionalRow(dbSchemas.userSchema, row);
}

export async function createUser(input: CreateUserInput, sql: Db = getDb()): Promise<User> {
	const [row] = await sql`
		INSERT INTO users (username, password_hash) VALUES (${input.username}, ${input.password_hash})
		RETURNING *
	`;
	return parseRow(dbSchemas.userSchema, row);
}

export async function listUsers(sql: Db = getDb()): Promise<Array<Pick<User, 'id' | 'username'>>> {
	const rows = await sql`SELECT id, username FROM users ORDER BY username ASC`;
	return rows.map((r) => parseRow(dbSchemas.userSchema.pick({ id: true, username: true }), r));
}

export async function listOtherUsers(
	currentUserId: number,
	sql: Db = getDb()
): Promise<Array<Pick<User, 'id' | 'username'>>> {
	const rows =
		await sql`SELECT id, username FROM users WHERE id != ${currentUserId} ORDER BY username ASC`;
	return rows.map((r) => parseRow(dbSchemas.userSchema.pick({ id: true, username: true }), r));
}

export async function listUsersWithCategoryAccess(
	categoryId: number,
	sql: Db = getDb()
): Promise<Array<Pick<User, 'id' | 'username'>>> {
	const rows = await sql`
		SELECT DISTINCT u.id, u.username
		FROM users u
		LEFT JOIN categories c ON c.user_id = u.id AND c.id = ${categoryId}
		LEFT JOIN shared_access sa ON sa.shared_with_user_id = u.id AND sa.category_id = ${categoryId}
		WHERE c.id IS NOT NULL OR sa.category_id IS NOT NULL
		ORDER BY u.username ASC
	`;
	return rows.map((r) => parseRow(dbSchemas.userSchema.pick({ id: true, username: true }), r));
}
