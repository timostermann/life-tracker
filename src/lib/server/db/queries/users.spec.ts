import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { listOtherUsers, listUsers, listUsersWithCategoryAccess } from './users';

describe('users queries', () => {
	let db: Database.Database;

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

		db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('tim', 'x');
		db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('jule', 'y');
		db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('max', 'z');
	});

	it('lists all users ordered by username', () => {
		const users = listUsers(db);
		expect(users.map((u) => u.username)).toEqual(['jule', 'max', 'tim']);
	});

	it('lists other users excluding current user', () => {
		const row = db.prepare('SELECT id FROM users WHERE username = ?').get('tim') as { id: number };
		const timId = Number(row.id);

		const users = listOtherUsers(timId, db);
		expect(users.map((u) => u.username)).toEqual(['jule', 'max']);
	});

	describe('listUsersWithCategoryAccess', () => {
		it('returns only the owner when no shares exist', () => {
			const timRow = db.prepare('SELECT id FROM users WHERE username = ?').get('tim') as {
				id: number;
			};
			const timId = Number(timRow.id);

			db.prepare('INSERT INTO categories (user_id, name, template_type) VALUES (?, ?, ?)').run(
				timId,
				'My Tasks',
				'task'
			);
			const categoryRow = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
			const categoryId = Number(categoryRow.id);

			const users = listUsersWithCategoryAccess(categoryId, db);
			expect(users.map((u) => u.username)).toEqual(['tim']);
		});

		it('returns owner and users with shared access', () => {
			const timRow = db.prepare('SELECT id FROM users WHERE username = ?').get('tim') as {
				id: number;
			};
			const timId = Number(timRow.id);
			const juleRow = db.prepare('SELECT id FROM users WHERE username = ?').get('jule') as {
				id: number;
			};
			const juleId = Number(juleRow.id);

			db.prepare('INSERT INTO categories (user_id, name, template_type) VALUES (?, ?, ?)').run(
				timId,
				'My Tasks',
				'task'
			);
			const categoryRow = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
			const categoryId = Number(categoryRow.id);

			db.prepare(
				'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
			).run(categoryId, juleId, 'view');

			const users = listUsersWithCategoryAccess(categoryId, db);
			expect(users.map((u) => u.username)).toEqual(['jule', 'tim']);
		});

		it('does not return users without access', () => {
			const timRow = db.prepare('SELECT id FROM users WHERE username = ?').get('tim') as {
				id: number;
			};
			const timId = Number(timRow.id);
			const juleRow = db.prepare('SELECT id FROM users WHERE username = ?').get('jule') as {
				id: number;
			};
			const juleId = Number(juleRow.id);

			db.prepare('INSERT INTO categories (user_id, name, template_type) VALUES (?, ?, ?)').run(
				timId,
				'My Tasks',
				'task'
			);
			const categoryRow = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
			const categoryId = Number(categoryRow.id);

			db.prepare(
				'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
			).run(categoryId, juleId, 'edit');

			const users = listUsersWithCategoryAccess(categoryId, db);
			// max should not be in the list
			expect(users.map((u) => u.username)).toEqual(['jule', 'tim']);
		});

		it('returns users sorted alphabetically', () => {
			const timRow = db.prepare('SELECT id FROM users WHERE username = ?').get('tim') as {
				id: number;
			};
			const timId = Number(timRow.id);
			const juleRow = db.prepare('SELECT id FROM users WHERE username = ?').get('jule') as {
				id: number;
			};
			const juleId = Number(juleRow.id);
			const maxRow = db.prepare('SELECT id FROM users WHERE username = ?').get('max') as {
				id: number;
			};
			const maxId = Number(maxRow.id);

			db.prepare('INSERT INTO categories (user_id, name, template_type) VALUES (?, ?, ?)').run(
				timId,
				'My Tasks',
				'task'
			);
			const categoryRow = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
			const categoryId = Number(categoryRow.id);

			db.prepare(
				'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
			).run(categoryId, juleId, 'view');
			db.prepare(
				'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
			).run(categoryId, maxId, 'edit');

			const users = listUsersWithCategoryAccess(categoryId, db);
			expect(users.map((u) => u.username)).toEqual(['jule', 'max', 'tim']);
		});

		it('returns empty array for non-existent category', () => {
			const users = listUsersWithCategoryAccess(999, db);
			expect(users).toEqual([]);
		});
	});
});
