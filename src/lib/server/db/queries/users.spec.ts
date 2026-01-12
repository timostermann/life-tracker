import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { listOtherUsers, listUsers } from './users';

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
    `);

		db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('tim', 'x');
		db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('jule', 'y');
	});

	it('lists all users ordered by username', () => {
		const users = listUsers(db);
		expect(users.map((u) => u.username)).toEqual(['jule', 'tim']);
	});

	it('lists other users excluding current user', () => {
		const row = db.prepare('SELECT id FROM users WHERE username = ?').get('tim') as { id: number };
		const timId = Number(row.id);

		const users = listOtherUsers(timId, db);
		expect(users.map((u) => u.username)).toEqual(['jule']);
	});
});
