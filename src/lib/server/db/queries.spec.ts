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
	const dbMod = await import('$lib/server/db');
	const queries = await import('$lib/server/db/queries');
	const db = dbMod.getDb();
	return { db, close: dbMod.closeDbForTests, queries };
}

describe('db queries', () => {
	it('lists seeded templates', async () => {
		const { queries, close } = await freshDb();
		const templates = queries.listTemplates();
		expect(templates).toHaveLength(3);
		expect(templates.map((t) => t.template_type)).toContain('task');
		expect(templates.map((t) => t.template_type)).toContain('chore');
		expect(templates.map((t) => t.template_type)).toContain('habit');
		close();
	});

	it('creates user and category', async () => {
		const { queries, close } = await freshDb();

		const user = queries.createUser({ username: 'tim', password_hash: 'hash' });
		expect(user.username).toBe('tim');

		const category = queries.createCategory({
			user_id: user.id,
			name: 'Work Tasks',
			template_type: 'task',
			is_private: true
		});
		expect(category.user_id).toBe(user.id);
		expect(category.template_type).toBe('task');

		const lists = queries.listCategoriesForUser(user.id);
		expect(lists.owned.length).toBe(1);
		expect(lists.shared.length).toBe(0);

		close();
	});
});
