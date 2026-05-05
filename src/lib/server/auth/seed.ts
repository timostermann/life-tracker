import { env } from '$env/dynamic/private';

import { createLogger } from '$lib/server/logging';
import { getDb } from '$lib/server/db';
import { getUserByUsername } from '$lib/server/db/queries';
import type { Db } from '$lib/server/db/queries/utils';

import { hashPassword } from './password';

const logger = createLogger('auth');

type SeedUser = { username: string; envVar: string };

const seedUsers: SeedUser[] = [
	{ username: 'tim', envVar: 'AUTH_SEED_TIM_PASSWORD' },
	{ username: 'jule', envVar: 'AUTH_SEED_JULE_PASSWORD' }
];

function parseBool(v: string | undefined): boolean {
	if (!v) return false;
	const n = v.trim().toLowerCase();
	return n === '1' || n === 'true' || n === 'yes' || n === 'on';
}

function getSeedPassword(envVar: string, username: string): string {
	const value = (env as Record<string, string | undefined>)[envVar]?.trim();
	if (value) return value;

	if (import.meta.env.PROD) return '';

	logger.warn('seeding user with default password (dev only)', { username, envVar });
	return username;
}

export async function ensureSeedUsers(opts?: { db?: Db }) {
	const sql = opts?.db ?? getDb();
	const force = parseBool((env as Record<string, string | undefined>).AUTH_SEED_FORCE);
	const missingUsers: string[] = [];

	for (const u of seedUsers) {
		const existing = await getUserByUsername(u.username, sql);
		const password = getSeedPassword(u.envVar, u.username);
		if (!password) {
			logger.warn('skipping seed user (missing password env var)', {
				username: u.username,
				envVar: u.envVar
			});
			continue;
		}
		const password_hash = await hashPassword(password);
		if (!existing) {
			await sql`
				INSERT INTO users (username, password_hash)
				VALUES (${u.username}, ${password_hash})
				ON CONFLICT (username) DO NOTHING
			`;
			logger.info('seeded user', { username: u.username });
		} else if (force) {
			await sql`UPDATE users SET password_hash = ${password_hash}, updated_at = NOW() WHERE username = ${u.username}`;
			logger.warn('updated seed user password_hash (AUTH_SEED_FORCE)', { username: u.username });
		}

		const seeded = await getUserByUsername(u.username, sql);
		if (!seeded) missingUsers.push(u.username);
	}

	const rows = await sql<{ username: string }[]>`
		SELECT username FROM users WHERE username IN ${sql(seedUsers.map((u) => u.username))} ORDER BY username ASC
	`;
	const seededUsernames = new Set(rows.map((row) => row.username));
	for (const u of seedUsers) {
		if (!seededUsernames.has(u.username) && !missingUsers.includes(u.username)) {
			missingUsers.push(u.username);
		}
	}

	if (missingUsers.length > 0) {
		throw new Error(`Missing required seed users: ${missingUsers.join(', ')}`);
	}

	logger.info('seed users ready', { users: rows.map((row) => row.username) });
}
