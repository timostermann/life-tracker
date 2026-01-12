import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { POST } from './+server';

describe('POST /api/categories/:id/share', () => {
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
				.run(ownerId, 'Household', 'task', 1).lastInsertRowid
		);
	});

	it('returns 401 when not authenticated', async () => {
		const request = new Request('http://test/api/categories/1/share', {
			method: 'POST',
			body: JSON.stringify({ user_id: otherId, permission: 'view' }),
			headers: { 'content-type': 'application/json' }
		});

		const res = await POST({
			params: { id: String(categoryId) },
			request,
			locals: { user: null, db }
		} as unknown as Parameters<typeof POST>[0]);
		expect(res.status).toBe(401);
	});

	it('rejects sharing with self', async () => {
		const request = new Request('http://test/api/categories/1/share', {
			method: 'POST',
			body: JSON.stringify({ user_id: ownerId, permission: 'view' }),
			headers: { 'content-type': 'application/json' }
		});

		const res = await POST({
			params: { id: String(categoryId) },
			request,
			locals: { user: { id: ownerId, username: 'tim' }, db }
		} as unknown as Parameters<typeof POST>[0]);

		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.toast).toBe('error');
	});

	it('shares category and sets is_private=false', async () => {
		const request = new Request('http://test/api/categories/1/share', {
			method: 'POST',
			body: JSON.stringify({ user_id: otherId, permission: 'edit' }),
			headers: { 'content-type': 'application/json' }
		});

		const res = await POST({
			params: { id: String(categoryId) },
			request,
			locals: { user: { id: ownerId, username: 'tim' }, db }
		} as unknown as Parameters<typeof POST>[0]);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.toast).toBe('success');

		const shareCount = Number(
			(
				db
					.prepare('SELECT COUNT(*) AS c FROM shared_access WHERE category_id = ?')
					.get(categoryId) as { c: number }
			).c
		);
		expect(shareCount).toBe(1);

		const privacy = db
			.prepare('SELECT is_private FROM categories WHERE id = ?')
			.get(categoryId) as {
			is_private: number;
		};
		expect(privacy.is_private).toBe(0);
	});

	it('rejects duplicate share', async () => {
		db.prepare(
			'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
		).run(categoryId, otherId, 'view');

		const request = new Request('http://test/api/categories/1/share', {
			method: 'POST',
			body: JSON.stringify({ user_id: otherId, permission: 'edit' }),
			headers: { 'content-type': 'application/json' }
		});

		const res = await POST({
			params: { id: String(categoryId) },
			request,
			locals: { user: { id: ownerId, username: 'tim' }, db }
		} as unknown as Parameters<typeof POST>[0]);

		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.toast).toBe('error');
	});
});
