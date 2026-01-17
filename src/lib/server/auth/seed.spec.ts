import Database from 'better-sqlite3';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { migrate } from '$lib/server/db/migrate';
import { ensureSeedUsers } from './seed';

describe('auth/seed', () => {
	let db: Database.Database;
	const originalEnv = { ...process.env };

	beforeEach(() => {
		db = new Database(':memory:');
		db.pragma('foreign_keys = ON');
		migrate(db);
		process.env.AUTH_SEED_TIM_PASSWORD = 'tim-pass';
		process.env.AUTH_SEED_JULE_PASSWORD = 'jule-pass';
	});

	afterEach(() => {
		db.close();
		process.env = { ...originalEnv };
	});

	it('creates tim and jule idempotently', async () => {
		await ensureSeedUsers({ db });
		await ensureSeedUsers({ db });

		const cTim = db
			.prepare<[string], { c: number }>('SELECT COUNT(*) AS c FROM users WHERE username = ?')
			.get('tim')?.c;
		const cJule = db
			.prepare<[string], { c: number }>('SELECT COUNT(*) AS c FROM users WHERE username = ?')
			.get('jule')?.c;

		expect(cTim).toBe(1);
		expect(cJule).toBe(1);
	});
});
