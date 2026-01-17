import Database from 'better-sqlite3';
import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { migrate } from '$lib/server/db/migrate';
import * as queries from '$lib/server/db/queries';
import { hashPassword } from './password';
import { ensureSeedUsers } from './seed';

describe('auth/session', () => {
	let db: Database.Database;
	let lucia: Lucia;
	const originalEnv = { ...process.env };

	beforeEach(async () => {
		db = new Database(':memory:');
		db.pragma('foreign_keys = ON');
		migrate(db);
		process.env.AUTH_SEED_TIM_PASSWORD = 'x';
		process.env.AUTH_SEED_JULE_PASSWORD = 'y';
		await ensureSeedUsers({ db });

		// Create lucia instance for this test
		const adapter = new BetterSqlite3Adapter(db, {
			user: 'users',
			session: 'sessions'
		});
		lucia = new Lucia(adapter, {
			sessionCookie: { attributes: { secure: false } },
			getUserAttributes: (attributes) => ({
				username: attributes.username
			})
		});
	});

	afterEach(() => {
		db.close();
		process.env = { ...originalEnv };
	});

	it('creates, validates, and invalidates a session', async () => {
		const password_hash = await hashPassword('pw');
		const user = queries.createUser({ username: `u-${Date.now()}`, password_hash }, db);

		const session = await lucia.createSession(String(user.id), {});
		expect(session.id).toBeTruthy();

		const validated1 = await lucia.validateSession(session.id);
		expect(validated1.session).toBeTruthy();
		expect(validated1.user).toBeTruthy();

		await lucia.invalidateSession(session.id);
		const validated2 = await lucia.validateSession(session.id);
		expect(validated2.session).toBeNull();
		expect(validated2.user).toBeNull();
	});
});
