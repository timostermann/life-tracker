import { getDb } from '../../db';
import { dbSchemas, type CreateUserInput, type User } from './types';
import type { Db } from './utils';
import { parseOptionalRow } from './utils';

export function getUserById(id: number, db: Db = getDb()): User | undefined {
	const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown;
	return parseOptionalRow(dbSchemas.userSchema, row);
}

export function getUserByUsername(username: string, db: Db = getDb()): User | undefined {
	const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as unknown;
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
