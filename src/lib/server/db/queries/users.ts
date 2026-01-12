import { getDb } from '../../db';
import { dbSchemas, type CreateUserInput, type User } from './types';
import type { Db } from './utils';
import { parseOptionalRow, parseRow } from './utils';

export function getUserById(id: number, db: Db = getDb()): User | undefined {
	const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
	return parseOptionalRow(dbSchemas.userSchema, row);
}

export function getUserByUsername(username: string, db: Db = getDb()): User | undefined {
	const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
	return parseOptionalRow(dbSchemas.userSchema, row);
}

export function createUser(input: CreateUserInput, db: Db = getDb()): User {
	const res = db
		.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
		.run(input.username, input.password_hash);
	const created = getUserById(Number(res.lastInsertRowid), db);
	if (!created) throw new Error('Failed to create user');
	return created;
}

export function listUsers(db: Db = getDb()): Array<Pick<User, 'id' | 'username'>> {
	const rows = db.prepare('SELECT id, username FROM users ORDER BY username ASC').all();
	return rows.map((row) => parseRow(dbSchemas.userSchema.pick({ id: true, username: true }), row));
}

export function listOtherUsers(
	currentUserId: number,
	db: Db = getDb()
): Array<Pick<User, 'id' | 'username'>> {
	const rows = db
		.prepare('SELECT id, username FROM users WHERE id != ? ORDER BY username ASC')
		.all(currentUserId);
	return rows.map((row) => parseRow(dbSchemas.userSchema.pick({ id: true, username: true }), row));
}
