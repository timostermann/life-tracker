import { env } from '$env/dynamic/private';

import { createLogger } from '$lib/server/logging';
import { getDb } from '$lib/server/db';
import { createUser, getUserByUsername } from '$lib/server/db/queries';
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
			await createUser({ username: u.username, password_hash }, sql);
			logger.info('seeded user', { username: u.username });
			continue;
		}

		if (force) {
			await sql`UPDATE users SET password_hash = ${password_hash}, updated_at = NOW() WHERE username = ${u.username}`;
			logger.warn('updated seed user password_hash (AUTH_SEED_FORCE)', { username: u.username });
		}
	}
}
