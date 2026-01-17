import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { migrate } from '$lib/server/db/migrate';
import * as queries from '$lib/server/db/queries';

describe('db queries', () => {
	let db: Database.Database;

	beforeEach(() => {
		db = new Database(':memory:');
		db.pragma('foreign_keys = ON');
		migrate(db);
	});

	afterEach(() => {
		db.close();
	});

	it('lists seeded templates', () => {
		const templates = queries.listTemplates(undefined, db);
		expect(templates).toHaveLength(3);
		expect(templates.map((t) => t.template_type)).toContain('task');
		expect(templates.map((t) => t.template_type)).toContain('chore');
		expect(templates.map((t) => t.template_type)).toContain('habit');
	});

	it('creates user and category', () => {
		const user = queries.createUser({ username: `tim-${randomUUID()}`, password_hash: 'hash' }, db);
		expect(user.username.startsWith('tim-')).toBe(true);

		const category = queries.createCategory(
			{
				user_id: user.id,
				name: 'Work Tasks',
				template_type: 'task',
				is_private: true
			},
			db
		);
		expect(category.user_id).toBe(user.id);
		expect(category.template_type).toBe('task');

		const lists = queries.listCategoriesForUser(user.id, db);
		expect(lists.owned.length).toBe(1);
		expect(lists.shared.length).toBe(0);
	});
});
