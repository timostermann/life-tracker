import { createHash, randomBytes } from 'node:crypto';

import {
	apiTokenListItemSchema,
	apiTokenSchema,
	type ApiToken,
	type ApiTokenListItem
} from '$lib/schemas/db';

import { getDb } from '../../db';
import { getUserById } from './users';
import type { Db } from './utils';
import { parseOptionalRow, parseRow } from './utils';

/** Minimum seconds between `last_used_at` writes for Bearer-authenticated requests. */
export const API_TOKEN_LAST_USED_TOUCH_INTERVAL_SEC = 300;

function sha256hex(value: string): string {
	return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function hashApiToken(raw: string): string {
	return sha256hex(raw);
}

export function getApiTokenByHash(tokenHash: string, db: Db = getDb()): ApiToken | undefined {
	const row = db.prepare('SELECT * FROM api_tokens WHERE token_hash = ?').get(tokenHash);
	return parseOptionalRow(apiTokenSchema, row);
}

/**
 * Bumps `last_used_at` only if it is unset or older than `minIntervalSec`
 * (avoids a write on every API call when using Bearer tokens).
 */
export function touchApiTokenLastUsedIfStale(
	id: number,
	db: Db = getDb(),
	minIntervalSec: number = API_TOKEN_LAST_USED_TOUCH_INTERVAL_SEC
): void {
	db.prepare(
		`UPDATE api_tokens SET last_used_at = unixepoch()
     WHERE id = ? AND (last_used_at IS NULL OR last_used_at < unixepoch() - ?)`
	).run(id, minIntervalSec);
}

export function createApiToken(
	userId: number,
	name: string,
	db: Db = getDb()
): { id: number; name: string; token: string; created_at: number } {
	const token = randomBytes(32).toString('hex');
	const token_hash = sha256hex(token);
	const res = db
		.prepare('INSERT INTO api_tokens (user_id, name, token_hash) VALUES (?, ?, ?)')
		.run(userId, name, token_hash);
	const id = Number(res.lastInsertRowid);
	const row = db.prepare('SELECT * FROM api_tokens WHERE id = ?').get(id);
	const parsed = parseRow(apiTokenSchema, row);
	return {
		id: parsed.id,
		name: parsed.name,
		token,
		created_at: parsed.created_at
	};
}

export function listUserApiTokens(userId: number, db: Db = getDb()): ApiTokenListItem[] {
	const rows = db
		.prepare(
			`SELECT id, name, created_at, last_used_at
       FROM api_tokens
       WHERE user_id = ?
       ORDER BY id ASC`
		)
		.all(userId);
	return rows.map((row) => parseRow(apiTokenListItemSchema, row));
}

export function deleteApiToken(id: number, userId: number, db: Db = getDb()): boolean {
	const res = db.prepare('DELETE FROM api_tokens WHERE id = ? AND user_id = ?').run(id, userId);
	return res.changes > 0;
}

/**
 * Validates raw Bearer secret and returns app user for `event.locals`.
 */
export function resolveUserFromBearerToken(
	rawToken: string,
	db: Db = getDb()
): { id: number; username: string } | null {
	const trimmed = rawToken.trim();
	if (!trimmed) return null;

	const tokenRow = getApiTokenByHash(hashApiToken(trimmed), db);
	if (!tokenRow) return null;

	touchApiTokenLastUsedIfStale(tokenRow.id, db);

	const dbUser = getUserById(tokenRow.user_id, db);
	if (!dbUser) return null;

	return { id: dbUser.id, username: dbUser.username };
}
