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

	// In production builds, only seed if explicit passwords are provided.
	// This avoids creating default accounts when running `npm run preview` or in real deployments.
	if (import.meta.env.PROD) return '';

	// Dev-friendly default.
	logger.warn('seeding user with default password (dev only)', { username, envVar });
	return username;
}

/**
 * Seed initial user accounts (idempotent).
 * - Creates `tim` and `jule` if they don't exist.
 * - Passwords come from env vars (required in PROD) or default to username in dev.
 * - If AUTH_SEED_FORCE=true, also updates existing users' password_hash (dev recovery).
 */
export async function ensureSeedUsers(opts?: { db?: Db }) {
	const db = opts?.db ?? getDb();
	const force = parseBool((env as Record<string, string | undefined>).AUTH_SEED_FORCE);

	for (const u of seedUsers) {
		const existing = getUserByUsername(u.username, db);
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
			createUser({ username: u.username, password_hash }, db);
			logger.info('seeded user', { username: u.username });
			continue;
		}

		// Repair mode: overwrite existing hash when explicitly requested.
		if (force) {
			db.prepare(
				'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?'
			).run(password_hash, u.username);
			logger.warn('updated seed user password_hash (AUTH_SEED_FORCE)', { username: u.username });
		}
	}
}
