import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { GET } from './+server';

describe('GET /api/categories/:id/shares', () => {
	let db: Database.Database;
	let ownerId: number;
	let otherId: number;
	let categoryId: number;

	beforeEach(() => {
		db = new Database(':memory:');
		db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        template_type TEXT NOT NULL CHECK(template_type IN ('task', 'chore', 'habit')),
        icon TEXT,
        color TEXT,
        is_private INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE shared_access (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        shared_with_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission TEXT NOT NULL CHECK(permission IN ('view', 'edit')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category_id, shared_with_user_id)
      );
    `);

		ownerId = Number(
			db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('tim', 'x')
				.lastInsertRowid
		);
		otherId = Number(
			db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('jule', 'y')
				.lastInsertRowid
		);

		categoryId = Number(
			db
				.prepare(
					'INSERT INTO categories (user_id, name, template_type, is_private) VALUES (?, ?, ?, ?)'
				)
				.run(ownerId, 'Household', 'task', 0).lastInsertRowid
		);

		db.prepare(
			'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
		).run(categoryId, otherId, 'view');
	});

	it('returns 401 when not authenticated', async () => {
		const res = await GET({
			params: { id: String(categoryId) },
			locals: { user: null, db }
		} as unknown as Parameters<typeof GET>[0]);
		expect(res.status).toBe(401);
	});

	it('returns 400 on invalid category id', async () => {
		const res = await GET({
			params: { id: 'nope' },
			locals: { user: { id: ownerId, username: 'tim' }, db }
		} as unknown as Parameters<typeof GET>[0]);
		expect(res.status).toBe(400);
	});

	it('returns 404 when not owner', async () => {
		const res = await GET({
			params: { id: String(categoryId) },
			locals: { user: { id: otherId, username: 'jule' }, db }
		} as unknown as Parameters<typeof GET>[0]);
		expect(res.status).toBe(404);
	});

	it('returns share list for owner', async () => {
		const res = await GET({
			params: { id: String(categoryId) },
			locals: { user: { id: ownerId, username: 'tim' }, db }
		} as unknown as Parameters<typeof GET>[0]);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.shares).toEqual([{ user_id: otherId, username: 'jule', permission: 'view' }]);
	});
});
