import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { GET } from './+server';

describe('GET /api/users', () => {
	let db: Database.Database;
	let timId: number;
	let juleId: number;

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

		timId = Number(
			db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('tim', 'x')
				.lastInsertRowid
		);
		juleId = Number(
			db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('jule', 'y')
				.lastInsertRowid
		);
	});

	it('returns 401 when not authenticated', async () => {
		const res = await GET({ locals: { user: null, db } } as unknown as Parameters<typeof GET>[0]);
		expect(res.status).toBe(401);
	});

	it('returns all users including the current user', async () => {
		const res = await GET({
			locals: { user: { id: timId, username: 'tim' }, db }
		} as unknown as Parameters<typeof GET>[0]);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.users).toEqual([
			{ id: juleId, username: 'jule' },
			{ id: timId, username: 'tim' }
		]);
	});
});
