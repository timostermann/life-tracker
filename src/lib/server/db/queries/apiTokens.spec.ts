import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import {
	API_TOKEN_LAST_USED_TOUCH_INTERVAL_SEC,
	createApiToken,
	deleteApiToken,
	getApiTokenByHash,
	hashApiToken,
	listUserApiTokens,
	resolveUserFromBearerToken,
	touchApiTokenLastUsedIfStale
} from './apiTokens';
import { createUser } from './users';

describe('apiTokens queries', () => {
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
		const user = createUser({ username: 'u1', password_hash: 'h' }, db);
		userId = user.id;
	});

	afterEach(() => {
		db.close();
	});

	it('createApiToken stores hash and returns raw token once', () => {
		const created = createApiToken(userId, 'my-bot', db);
		expect(created.token).toMatch(/^[a-f0-9]{64}$/);
		expect(created.name).toBe('my-bot');

		const row = getApiTokenByHash(hashApiToken(created.token), db);
		expect(row).toBeDefined();
		expect(row?.token_hash).toBe(hashApiToken(created.token));
		expect(row?.user_id).toBe(userId);
	});

	it('getApiTokenByHash returns null for unknown hash', () => {
		expect(getApiTokenByHash('deadbeef', db)).toBeUndefined();
	});

	it('listUserApiTokens omits token_hash', () => {
		const { token: rawSecret } = createApiToken(userId, 'a', db);
		const list = listUserApiTokens(userId, db);
		expect(list).toHaveLength(1);
		expect(list[0]).toEqual({
			id: expect.any(Number),
			name: 'a',
			created_at: expect.any(Number),
			last_used_at: null
		});
		expect(JSON.stringify(list[0])).not.toContain(hashApiToken(rawSecret));
	});

	it('touchApiTokenLastUsedIfStale sets last_used_at when unset', () => {
		const { id } = createApiToken(userId, 'a', db);
		expect(listUserApiTokens(userId, db)[0].last_used_at).toBeNull();

		touchApiTokenLastUsedIfStale(id, db);

		const listed = listUserApiTokens(userId, db)[0];
		expect(listed.last_used_at).toEqual(expect.any(Number));
		expect(listed.last_used_at).not.toBeNull();
	});

	it('touchApiTokenLastUsedIfStale skips write when recently touched', () => {
		const { id } = createApiToken(userId, 'a', db);
		const longInterval = 86_400;
		touchApiTokenLastUsedIfStale(id, db, longInterval);
		const first = listUserApiTokens(userId, db)[0].last_used_at;

		touchApiTokenLastUsedIfStale(id, db, longInterval);
		const second = listUserApiTokens(userId, db)[0].last_used_at;

		expect(first).not.toBeNull();
		expect(second).toBe(first);
	});

	it('touchApiTokenLastUsedIfStale writes again after interval elapsed', () => {
		const { id } = createApiToken(userId, 'a', db);
		db.prepare('UPDATE api_tokens SET last_used_at = unixepoch() - ? WHERE id = ?').run(
			API_TOKEN_LAST_USED_TOUCH_INTERVAL_SEC + 1,
			id
		);
		const stale = listUserApiTokens(userId, db)[0].last_used_at;
		expect(stale).not.toBeNull();

		touchApiTokenLastUsedIfStale(id, db, API_TOKEN_LAST_USED_TOUCH_INTERVAL_SEC);
		const refreshed = listUserApiTokens(userId, db)[0].last_used_at;

		expect(refreshed).not.toBeNull();
		expect(refreshed!).toBeGreaterThan(stale!);
	});

	it('deleteApiToken removes row when id and user match', () => {
		const { id } = createApiToken(userId, 'a', db);
		expect(deleteApiToken(id, userId, db)).toBe(true);
		expect(listUserApiTokens(userId, db)).toHaveLength(0);
	});

	it('deleteApiToken returns false for wrong user', () => {
		const { id } = createApiToken(userId, 'a', db);
		expect(deleteApiToken(id, 9999, db)).toBe(false);
		expect(listUserApiTokens(userId, db)).toHaveLength(1);
	});

	it('resolveUserFromBearerToken returns user and updates last_used', () => {
		const { token, id } = createApiToken(userId, 'bot', db);
		const resolved = resolveUserFromBearerToken(token, db);
		expect(resolved).toEqual({ id: userId, username: 'u1' });

		const listed = listUserApiTokens(userId, db)[0];
		expect(listed.last_used_at).not.toBeNull();
		expect(listed.id).toBe(id);
	});

	it('resolveUserFromBearerToken returns null for invalid token', () => {
		expect(resolveUserFromBearerToken('not-a-real-token', db)).toBeNull();
	});

	it('resolveUserFromBearerToken returns null for whitespace-only', () => {
		expect(resolveUserFromBearerToken('   ', db)).toBeNull();
	});

	it('resolveUserFromBearerToken does not bump last_used twice within touch interval', () => {
		const { token } = createApiToken(userId, 'bot', db);
		resolveUserFromBearerToken(token, db);
		const once = listUserApiTokens(userId, db)[0].last_used_at;
		resolveUserFromBearerToken(token, db);
		const twice = listUserApiTokens(userId, db)[0].last_used_at;
		expect(once).not.toBeNull();
		expect(twice).toBe(once);
	});
});
