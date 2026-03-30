import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { GET, POST } from './+server';
import { API_TOKEN_NAME_MAX_LENGTH } from '$lib/schemas/apiTokens';
import { createUser } from '$lib/server/db/queries/users';
import { createApiToken } from '$lib/server/db/queries/apiTokens';

describe('GET /api/tokens', () => {
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
		const user = createUser({ username: 'alice', password_hash: 'x' }, db);
		userId = user.id;
	});

	afterEach(() => {
		db.close();
	});

	it('returns 401 when not authenticated', async () => {
		const res = await GET({
			locals: { user: null, db }
		} as Parameters<typeof GET>[0]);
		expect(res.status).toBe(401);
	});

	it('returns tokens for the current user', async () => {
		createApiToken(userId, 't1', db);
		const res = await GET({
			locals: { user: { id: userId, username: 'alice' }, db }
		} as Parameters<typeof GET>[0]);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.tokens).toHaveLength(1);
		expect(body.tokens[0].name).toBe('t1');
		expect(body.tokens[0]).not.toHaveProperty('token_hash');
	});
});

describe('POST /api/tokens', () => {
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
		const user = createUser({ username: 'bob', password_hash: 'x' }, db);
		userId = user.id;
	});

	afterEach(() => {
		db.close();
	});

	it('returns 401 when not authenticated', async () => {
		const res = await POST({
			locals: { user: null, db },
			request: new Request('http://localhost/api/tokens', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: 'n' })
			})
		} as Parameters<typeof POST>[0]);
		expect(res.status).toBe(401);
	});

	it('returns 400 for invalid JSON', async () => {
		const res = await POST({
			locals: { user: { id: userId, username: 'bob' }, db },
			request: new Request('http://localhost/api/tokens', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: 'not-json'
			})
		} as Parameters<typeof POST>[0]);
		expect(res.status).toBe(400);
	});

	it('returns 400 when name is empty', async () => {
		const res = await POST({
			locals: { user: { id: userId, username: 'bob' }, db },
			request: new Request('http://localhost/api/tokens', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: '' })
			})
		} as Parameters<typeof POST>[0]);
		expect(res.status).toBe(400);
	});

	it('returns 400 when name exceeds max length', async () => {
		const res = await POST({
			locals: { user: { id: userId, username: 'bob' }, db },
			request: new Request('http://localhost/api/tokens', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: 'n'.repeat(API_TOKEN_NAME_MAX_LENGTH + 1) })
			})
		} as Parameters<typeof POST>[0]);
		expect(res.status).toBe(400);
	});

	it('creates token and returns secret once', async () => {
		const res = await POST({
			locals: { user: { id: userId, username: 'bob' }, db },
			request: new Request('http://localhost/api/tokens', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: 'assistant' })
			})
		} as Parameters<typeof POST>[0]);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.name).toBe('assistant');
		expect(body.token).toMatch(/^[a-f0-9]{64}$/);
		expect(body).toHaveProperty('created_at');
	});
});
