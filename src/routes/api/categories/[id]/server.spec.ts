import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { GET, PUT } from './+server';

describe('/api/categories/:id (access)', () => {
	let db: Database.Database;
	let ownerId: number;
	let sharedUserId: number;
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

      CREATE TABLE fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        field_type TEXT NOT NULL CHECK(field_type IN ('text', 'number', 'date', 'boolean', 'select')),
        options TEXT,
        field_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
		sharedUserId = Number(
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
	});

	it('returns 403 for non-owner without share', async () => {
		const res = await GET({
			params: { id: String(categoryId) },
			locals: { user: { id: sharedUserId, username: 'jule' }, db }
		} as unknown as Parameters<typeof GET>[0]);
		expect(res.status).toBe(403);
	});

	it('allows shared user to GET category', async () => {
		db.prepare(
			'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
		).run(categoryId, sharedUserId, 'view');

		const res = await GET({
			params: { id: String(categoryId) },
			locals: { user: { id: sharedUserId, username: 'jule' }, db }
		} as unknown as Parameters<typeof GET>[0]);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.category.id).toBe(categoryId);
	});

	it('keeps PUT owner-only (shared user gets 404)', async () => {
		db.prepare(
			'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
		).run(categoryId, sharedUserId, 'edit');

		const request = new Request('http://test/api/categories/1', {
			method: 'PUT',
			body: JSON.stringify({ name: 'New Name' }),
			headers: { 'content-type': 'application/json' }
		});

		const res = await PUT({
			params: { id: String(categoryId) },
			request,
			locals: { user: { id: sharedUserId, username: 'jule' }, db }
		} as unknown as Parameters<typeof PUT>[0]);
		expect(res.status).toBe(404);
	});
});
