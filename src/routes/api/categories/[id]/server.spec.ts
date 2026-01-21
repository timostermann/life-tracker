import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

	afterEach(() => {
		db.close();
	});
});

describe('/api/categories/:id (field updates preserve field_values)', () => {
	let db: Database.Database;
	let ownerId: number;
	let categoryId: number;
	let fieldId: number;
	let itemId: number;

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

      CREATE TABLE items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        assigned_to_user_id INTEGER REFERENCES users(id),
        priority TEXT,
        deadline TEXT,
        time_estimate INTEGER,
        is_archived INTEGER DEFAULT 0,
        completed_at TEXT,
        recurring_config TEXT,
        next_show_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE field_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
        value TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(item_id, field_id)
      );
    `);

		ownerId = Number(
			db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('tim', 'x')
				.lastInsertRowid
		);

		categoryId = Number(
			db
				.prepare(
					'INSERT INTO categories (user_id, name, template_type, is_private) VALUES (?, ?, ?, ?)'
				)
				.run(ownerId, 'My Tasks', 'task', 1).lastInsertRowid
		);

		fieldId = Number(
			db
				.prepare(
					'INSERT INTO fields (category_id, name, field_type, field_order) VALUES (?, ?, ?, ?)'
				)
				.run(categoryId, 'Task Name', 'text', 0).lastInsertRowid
		);

		itemId = Number(
			db.prepare('INSERT INTO items (category_id, user_id) VALUES (?, ?)').run(categoryId, ownerId)
				.lastInsertRowid
		);

		db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
			itemId,
			fieldId,
			'My Important Task'
		);
	});

	afterEach(() => {
		db.close();
	});

	it('preserves field_values when renaming category (fields include id)', async () => {
		const request = new Request('http://test/api/categories/' + categoryId, {
			method: 'PUT',
			body: JSON.stringify({
				name: 'Renamed Category',
				fields: [
					{
						id: fieldId,
						name: 'Task Name',
						field_type: 'text',
						field_order: 0
					}
				]
			}),
			headers: { 'content-type': 'application/json' }
		});

		const res = await PUT({
			params: { id: String(categoryId) },
			request,
			locals: { user: { id: ownerId, username: 'tim' }, db }
		} as unknown as Parameters<typeof PUT>[0]);

		expect(res.status).toBe(200);

		// Verify field still exists with same ID
		const field = db.prepare('SELECT * FROM fields WHERE id = ?').get(fieldId) as
			| { id: number; name: string }
			| undefined;
		expect(field).toBeDefined();
		expect(field?.id).toBe(fieldId);
		expect(field?.name).toBe('Task Name');

		// Verify field_value still exists and has correct value
		const fieldValue = db.prepare('SELECT * FROM field_values WHERE item_id = ?').get(itemId) as
			| { item_id: number; field_id: number; value: string }
			| undefined;
		expect(fieldValue).toBeDefined();
		expect(fieldValue?.field_id).toBe(fieldId);
		expect(fieldValue?.value).toBe('My Important Task');
	});

	it('deletes field_values when field is removed from category', async () => {
		const request = new Request('http://test/api/categories/' + categoryId, {
			method: 'PUT',
			body: JSON.stringify({
				name: 'Category with no fields',
				fields: []
			}),
			headers: { 'content-type': 'application/json' }
		});

		const res = await PUT({
			params: { id: String(categoryId) },
			request,
			locals: { user: { id: ownerId, username: 'tim' }, db }
		} as unknown as Parameters<typeof PUT>[0]);

		expect(res.status).toBe(200);

		// Verify field was deleted
		const field = db.prepare('SELECT * FROM fields WHERE id = ?').get(fieldId);
		expect(field).toBeUndefined();

		// Verify field_value was cascade deleted
		const fieldValue = db.prepare('SELECT * FROM field_values WHERE item_id = ?').get(itemId);
		expect(fieldValue).toBeUndefined();
	});

	it('preserves existing field_values and creates new fields', async () => {
		const request = new Request('http://test/api/categories/' + categoryId, {
			method: 'PUT',
			body: JSON.stringify({
				name: 'Updated Category',
				fields: [
					{
						id: fieldId,
						name: 'Task Name',
						field_type: 'text',
						field_order: 0
					},
					{
						name: 'Priority',
						field_type: 'select',
						field_order: 1
					}
				]
			}),
			headers: { 'content-type': 'application/json' }
		});

		const res = await PUT({
			params: { id: String(categoryId) },
			request,
			locals: { user: { id: ownerId, username: 'tim' }, db }
		} as unknown as Parameters<typeof PUT>[0]);

		expect(res.status).toBe(200);

		// Verify old field still exists
		const oldField = db.prepare('SELECT * FROM fields WHERE id = ?').get(fieldId) as
			| { id: number; name: string }
			| undefined;
		expect(oldField).toBeDefined();
		expect(oldField?.id).toBe(fieldId);

		// Verify new field was created
		const allFields = db.prepare('SELECT * FROM fields WHERE category_id = ?').all(categoryId) as {
			id: number;
			name: string;
		}[];
		expect(allFields).toHaveLength(2);
		expect(allFields.map((f) => f.name)).toContain('Priority');

		// Verify field_value for old field still exists
		const fieldValue = db.prepare('SELECT * FROM field_values WHERE item_id = ?').get(itemId) as
			| { field_id: number; value: string }
			| undefined;
		expect(fieldValue).toBeDefined();
		expect(fieldValue?.field_id).toBe(fieldId);
		expect(fieldValue?.value).toBe('My Important Task');
	});
});
