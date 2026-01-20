import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { GET } from './+server';
import { createUser } from '$lib/server/db/queries/users';
import { createCategory } from '$lib/server/db/queries/categories';
import { createItem } from '$lib/server/db/queries/items';
import { createField } from '$lib/server/db/queries/fields';

describe('Dashboard API', () => {
	let db: Database.Database;
	let userId: number;

	beforeEach(() => {
		db = new Database(':memory:');

		db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        template_type TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        is_private INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE shared_access (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        shared_with_user_id INTEGER NOT NULL,
        permission TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (shared_with_user_id) REFERENCES users(id)
      );

      CREATE TABLE fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        field_type TEXT NOT NULL,
        options TEXT,
        field_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );

      CREATE TABLE items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        assigned_to_user_id INTEGER,
        priority TEXT,
        deadline DATETIME,
        time_estimate INTEGER,
        is_archived INTEGER NOT NULL DEFAULT 0,
        completed_at DATETIME,
        recurring_config TEXT,
        next_show_date DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE field_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        field_id INTEGER NOT NULL,
        value TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id),
        FOREIGN KEY (field_id) REFERENCES fields(id)
      );

      CREATE TABLE habit_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        logged_date DATE NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id),
        UNIQUE(item_id, logged_date)
      );
    `);

		const user = createUser({ username: 'testuser', password_hash: 'hash' }, db);
		userId = user.id;
	});

	it('should return 401 if not authenticated', async () => {
		const response = await GET({ locals: {} } as unknown as Parameters<typeof GET>[0]);
		const data = await response.json();

		expect(response.status).toBe(401);
		expect(data.error).toBe('Unauthorized');
	});

	it('should return dashboard data structure', async () => {
		createCategory({ user_id: userId, name: 'Test Category', template_type: 'task' }, db);

		const response = await GET({
			locals: { user: { id: userId }, db }
		} as unknown as Parameters<typeof GET>[0]);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty('categories');
		expect(data).toHaveProperty('assigned_to_me');
		expect(data).toHaveProperty('due_soon');
		expect(data).toHaveProperty('habits_today');
		expect(data.assigned_to_me).toHaveProperty('urgent');
		expect(data.assigned_to_me).toHaveProperty('high');
		expect(data.assigned_to_me).toHaveProperty('medium');
		expect(data.assigned_to_me).toHaveProperty('low');
	});

	it('should group assigned items by priority', async () => {
		const category = createCategory({ user_id: userId, name: 'Tasks', template_type: 'task' }, db);

		const field = createField(
			{
				category_id: category.id,
				name: 'Title',
				field_type: 'text',
				field_order: 1
			},
			db
		);

		// Create items with different priorities
		createItem(
			{
				category_id: category.id,
				user_id: userId,
				assigned_to_user_id: userId,
				priority: 'urgent',
				field_values: [{ field_id: field.id, value: 'Urgent Task' }]
			},
			db
		);

		createItem(
			{
				category_id: category.id,
				user_id: userId,
				assigned_to_user_id: userId,
				priority: 'high',
				field_values: [{ field_id: field.id, value: 'High Task' }]
			},
			db
		);

		const response = await GET({
			locals: { user: { id: userId }, db }
		} as unknown as Parameters<typeof GET>[0]);
		const data = await response.json();

		expect(data.assigned_to_me.urgent).toHaveLength(1);
		expect(data.assigned_to_me.high).toHaveLength(1);
		expect(data.assigned_to_me.medium).toHaveLength(0);
		expect(data.assigned_to_me.low).toHaveLength(0);
	});

	it('should return empty arrays when no data', async () => {
		const response = await GET({
			locals: { user: { id: userId }, db }
		} as unknown as Parameters<typeof GET>[0]);
		const data = await response.json();

		expect(data.categories).toHaveLength(0);
		expect(data.assigned_to_me.urgent).toHaveLength(0);
		expect(data.due_soon).toHaveLength(0);
		expect(data.habits_today).toHaveLength(0);
	});
});
