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

export async function getApiTokenByHash(
	tokenHash: string,
	sql: Db = getDb()
): Promise<ApiToken | undefined> {
	const [row] = await sql`SELECT * FROM api_tokens WHERE token_hash = ${tokenHash}`;
	return parseOptionalRow(apiTokenSchema, row);
}

export async function touchApiTokenLastUsedIfStale(
	id: number,
	sql: Db = getDb(),
	minIntervalSec: number = API_TOKEN_LAST_USED_TOUCH_INTERVAL_SEC
): Promise<void> {
	await sql`
		UPDATE api_tokens SET last_used_at = EXTRACT(EPOCH FROM NOW())::BIGINT
		WHERE id = ${id} AND (last_used_at IS NULL OR last_used_at < EXTRACT(EPOCH FROM NOW())::BIGINT - ${minIntervalSec})
	`;
}

export async function createApiToken(
	userId: number,
	name: string,
	sql: Db = getDb()
): Promise<{ id: number; name: string; token: string; created_at: number }> {
	const token = randomBytes(32).toString('hex');
	const token_hash = sha256hex(token);
	const [row] = await sql`
		INSERT INTO api_tokens (user_id, name, token_hash) VALUES (${userId}, ${name}, ${token_hash})
		RETURNING *
	`;
	const parsed = parseRow(apiTokenSchema, row);
	return {
		id: parsed.id,
		name: parsed.name,
		token,
		created_at: parsed.created_at
	};
}

export async function listUserApiTokens(
	userId: number,
	sql: Db = getDb()
): Promise<ApiTokenListItem[]> {
	const rows = await sql`
		SELECT id, name, created_at, last_used_at
		FROM api_tokens
		WHERE user_id = ${userId}
		ORDER BY id ASC
	`;
	return rows.map((row) => parseRow(apiTokenListItemSchema, row));
}

export async function deleteApiToken(
	id: number,
	userId: number,
	sql: Db = getDb()
): Promise<boolean> {
	const result = await sql`DELETE FROM api_tokens WHERE id = ${id} AND user_id = ${userId}`;
	return result.count > 0;
}

export async function resolveUserFromBearerToken(
	rawToken: string,
	sql: Db = getDb()
): Promise<{ id: number; username: string } | null> {
	const trimmed = rawToken.trim();
	if (!trimmed) return null;

	const tokenRow = await getApiTokenByHash(hashApiToken(trimmed), sql);
	if (!tokenRow) return null;

	await touchApiTokenLastUsedIfStale(tokenRow.id, sql);

	const dbUser = await getUserById(tokenRow.user_id, sql);
	if (!dbUser) return null;

	return { id: dbUser.id, username: dbUser.username };
}
