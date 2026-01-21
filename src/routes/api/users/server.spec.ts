import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { GET } from './+server';

describe('GET /api/users', () => {
	let db: Database.Database;
	let timId: number;
	let juleId: number;
	let maxId: number;

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
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        template_type TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        is_private INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE shared_access (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        shared_with_user_id INTEGER NOT NULL,
        permission TEXT NOT NULL CHECK(permission IN ('view', 'edit')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(category_id, shared_with_user_id)
      );
    `);

		timId = Number(
			db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('tim', 'x')
				.lastInsertRowid
		);
		juleId = Number(
			db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('jule', 'y')
				.lastInsertRowid
		);
		maxId = Number(
			db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('max', 'z')
				.lastInsertRowid
		);
	});

	it('returns 401 when not authenticated', async () => {
		const url = new URL('http://localhost/api/users');
		const res = await GET({
			locals: { user: null, db },
			url
		} as unknown as Parameters<typeof GET>[0]);
		expect(res.status).toBe(401);
	});

	it('returns all users including the current user', async () => {
		const url = new URL('http://localhost/api/users');
		const res = await GET({
			locals: { user: { id: timId, username: 'tim' }, db },
			url
		} as unknown as Parameters<typeof GET>[0]);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.users).toEqual([
			{ id: juleId, username: 'jule' },
			{ id: maxId, username: 'max' },
			{ id: timId, username: 'tim' }
		]);
	});

	it('returns only users with access to category when categoryId is provided', async () => {
		// Create a category owned by tim
		const categoryId = Number(
			db
				.prepare('INSERT INTO categories (user_id, name, template_type) VALUES (?, ?, ?)')
				.run(timId, 'My Tasks', 'task').lastInsertRowid
		);

		// Share the category with jule
		db.prepare(
			'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
		).run(categoryId, juleId, 'view');

		const url = new URL(`http://localhost/api/users?categoryId=${categoryId}`);
		const res = await GET({
			locals: { user: { id: timId, username: 'tim' }, db },
			url
		} as unknown as Parameters<typeof GET>[0]);
		expect(res.status).toBe(200);
		const body = await res.json();
		// Should only return tim (owner) and jule (shared), not max
		expect(body.users).toEqual([
			{ id: juleId, username: 'jule' },
			{ id: timId, username: 'tim' }
		]);
	});

	it('returns 400 when categoryId is invalid', async () => {
		const url = new URL('http://localhost/api/users?categoryId=invalid');
		const res = await GET({
			locals: { user: { id: timId, username: 'tim' }, db },
			url
		} as unknown as Parameters<typeof GET>[0]);
		expect(res.status).toBe(400);
	});
});
