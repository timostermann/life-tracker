import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

function tmpDbPath() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'life-tracker-db-'));
	return path.join(dir, 'db.sqlite');
}

async function freshDb() {
	const dbPath = tmpDbPath();
	process.env.DATABASE_PATH = dbPath;
	vi.resetModules();
	const mod = await import('$lib/server/db');
	const db = mod.getDb();
	return { db, close: mod.closeDbForTests, dbPath };
}

describe('db bootstrap', () => {
	it('runs migrations and seeds templates', async () => {
		const { db, close } = await freshDb();

		const tables = db
			.prepare<[], { name: string }>(
				"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
			)
			.all()
			.map((r) => r.name);

		expect(tables).toContain('users');
		expect(tables).toContain('templates');
		expect(tables).toContain('schema_version');
		expect(tables).toContain('sessions');

		const templateCount = db
			.prepare<[], { c: number }>('SELECT COUNT(*) AS c FROM templates')
			.get();
		expect(templateCount?.c).toBe(3);

		close();
	});

	it('enforces foreign keys', async () => {
		const { db, close } = await freshDb();

		expect(() => {
			db.prepare('INSERT INTO categories (user_id, name, template_type) VALUES (?, ?, ?)').run(
				9999,
				'Invalid',
				'task'
			);
		}).toThrow();

		close();
	});

	it('enables WAL mode', async () => {
		const { db, close } = await freshDb();
		const mode = db.pragma('journal_mode', { simple: true }) as string;
		expect(mode.toLowerCase()).toBe('wal');
		close();
	});
});
