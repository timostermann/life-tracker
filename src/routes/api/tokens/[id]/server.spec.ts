import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { DELETE } from './+server';
import { createUser } from '$lib/server/db/queries/users';
import { createApiToken } from '$lib/server/db/queries/apiTokens';

describe('DELETE /api/tokens/[id]', () => {
	let db: Database.Database;
	let userId: number;

	beforeEach(() => {
		db = new Database(':memory:');
		db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE api_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        last_used_at INTEGER
      );
    `);
		const user = createUser({ username: 'carl', password_hash: 'x' }, db);
		userId = user.id;
	});

	afterEach(() => {
		db.close();
	});

	it('returns 401 when not authenticated', async () => {
		const res = await DELETE({
			locals: { user: null, db },
			params: { id: '1' }
		} as Parameters<typeof DELETE>[0]);
		expect(res.status).toBe(401);
	});

	it('returns 400 for invalid id', async () => {
		const res = await DELETE({
			locals: { user: { id: userId, username: 'carl' }, db },
			params: { id: 'nope' }
		} as Parameters<typeof DELETE>[0]);
		expect(res.status).toBe(400);
	});

	it('returns 404 when token missing', async () => {
		const res = await DELETE({
			locals: { user: { id: userId, username: 'carl' }, db },
			params: { id: '99' }
		} as Parameters<typeof DELETE>[0]);
		expect(res.status).toBe(404);
	});

	it('deletes token for current user', async () => {
		const { id } = createApiToken(userId, 't', db);
		const res = await DELETE({
			locals: { user: { id: userId, username: 'carl' }, db },
			params: { id: String(id) }
		} as Parameters<typeof DELETE>[0]);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.toast).toBe('success');
	});
});
