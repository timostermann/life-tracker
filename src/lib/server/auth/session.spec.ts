import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { hashPassword } from './password';

function tmpDbPath() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'life-tracker-auth-session-'));
	return path.join(dir, 'db.sqlite');
}

async function fresh() {
	const dbPath = tmpDbPath();
	process.env.DATABASE_PATH = dbPath;
	process.env.AUTH_SEED_TIM_PASSWORD = 'x';
	process.env.AUTH_SEED_JULE_PASSWORD = 'y';
	vi.resetModules();
	const dbMod = await import('$lib/server/db');
	const queries = await import('$lib/server/db/queries');
	const auth = await import('$lib/server/auth');
	const seed = await import('./seed');
	const db = dbMod.getDb();
	await seed.ensureSeedUsers({ db });
	return { db, close: dbMod.closeDbForTests, queries, auth };
}

describe('auth/session', () => {
	it('creates, validates, and invalidates a session', async () => {
		const { queries, auth, close } = await fresh();

		const password_hash = await hashPassword('pw');
		const user = queries.createUser({ username: `u-${Date.now()}`, password_hash });

		const session = await auth.lucia.createSession(String(user.id), {});
		expect(session.id).toBeTruthy();

		const validated1 = await auth.lucia.validateSession(session.id);
		expect(validated1.session).toBeTruthy();
		expect(validated1.user).toBeTruthy();

		await auth.lucia.invalidateSession(session.id);
		const validated2 = await auth.lucia.validateSession(session.id);
		expect(validated2.session).toBeNull();
		expect(validated2.user).toBeNull();

		close();
	});
});
