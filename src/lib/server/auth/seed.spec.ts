import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

function tmpDbPath() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'life-tracker-auth-seed-'));
	return path.join(dir, 'db.sqlite');
}

async function freshDb() {
	const dbPath = tmpDbPath();
	process.env.DATABASE_PATH = dbPath;
	process.env.AUTH_SEED_TIM_PASSWORD = 'tim-pass';
	process.env.AUTH_SEED_JULE_PASSWORD = 'jule-pass';
	vi.resetModules();
	const dbMod = await import('$lib/server/db');
	const queries = await import('$lib/server/db/queries');
	const seed = await import('./seed');
	const db = dbMod.getDb();
	return { db, close: dbMod.closeDbForTests, queries, seed, dbPath };
}

describe('auth/seed', () => {
	it('creates tim and jule idempotently', async () => {
		const { db, seed, close } = await freshDb();

		await seed.ensureSeedUsers({ db });
		await seed.ensureSeedUsers({ db });

		const cTim = db
			.prepare<[string], { c: number }>('SELECT COUNT(*) AS c FROM users WHERE username = ?')
			.get('tim')?.c;
		const cJule = db
			.prepare<[string], { c: number }>('SELECT COUNT(*) AS c FROM users WHERE username = ?')
			.get('jule')?.c;

		expect(cTim).toBe(1);
		expect(cJule).toBe(1);

		close();
	});
});
