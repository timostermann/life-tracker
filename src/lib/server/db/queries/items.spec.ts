import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import {
	createItem,
	getItemById,
	getItemWithCategoryId,
	updateItem,
	deleteItem,
	completeItem,
	listItemsForCategory,
	listArchivedItemsForCategory,
	countItemsForCategory
} from './items';
import { createCategory } from './categories';
import { createUser } from './users';
import { createField } from './fields';

describe('items queries', () => {
	let db: Database.Database;
	let userId: number;
	let categoryId: number;
	let fieldId: number;

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
    `);

		const user = createUser({ username: 'testuser', password_hash: 'hash' }, db);
		userId = user.id;

		const category = createCategory(
			{
				user_id: userId,
				name: 'Test Category',
				template_type: 'task'
			},
			db
		);
		categoryId = category.id;

		const field = createField(
			{
				category_id: categoryId,
				name: 'Title',
				field_type: 'text',
				field_order: 0
			},
			db
		);
		fieldId = field.id;
	});

	afterEach(() => {
		db.close();
	});

	describe('createItem', () => {
		it('should create item with minimal fields', () => {
			const item = createItem(
				{
					category_id: categoryId,
					user_id: userId
				},
				db
			);

			expect(item.id).toBeDefined();
			expect(item.category_id).toBe(categoryId);
			expect(item.user_id).toBe(userId);
			expect(item.is_archived).toBe(false);
		});

		it('should create item with all optional fields', () => {
			const item = createItem(
				{
					category_id: categoryId,
					user_id: userId,
					assigned_to_user_id: userId,
					priority: 'high',
					deadline: '2026-01-15T10:00:00Z',
					time_estimate: 60,
					recurring_config: '{"frequency":"weekly","interval":1}',
					next_show_date: '2026-01-22T10:00:00Z',
					field_values: []
				},
				db
			);

			expect(item.assigned_to_user_id).toBe(userId);
			expect(item.priority).toBe('high');
			expect(item.deadline).toBeDefined();
			expect(item.time_estimate).toBe(60);
			expect(item.recurring_config).toBeDefined();
		});

		it('should create item with field values', () => {
			const item = createItem(
				{
					category_id: categoryId,
					user_id: userId,
					field_values: [{ field_id: fieldId, value: 'Test Task' }]
				},
				db
			);

			expect(item.id).toBeDefined();

			const values = db.prepare('SELECT * FROM field_values WHERE item_id = ?').all(item.id);
			expect(values).toHaveLength(1);
		});
	});

	describe('getItemById', () => {
		it('should return item by id', () => {
			const created = createItem({ category_id: categoryId, user_id: userId }, db);
			const item = getItemById(created.id, db);

			expect(item).toBeDefined();
			expect(item?.id).toBe(created.id);
		});

		it('should return null for non-existent item', () => {
			const item = getItemById(9999, db);
			expect(item).toBeNull();
		});
	});

	describe('getItemWithCategoryId', () => {
		it('should return category id for item', () => {
			const created = createItem({ category_id: categoryId, user_id: userId }, db);
			const catId = getItemWithCategoryId(created.id, db);

			expect(catId).toBe(categoryId);
		});

		it('should return null for non-existent item', () => {
			const catId = getItemWithCategoryId(9999, db);
			expect(catId).toBeNull();
		});
	});

	describe('updateItem', () => {
		it('should update item priority', () => {
			const created = createItem({ category_id: categoryId, user_id: userId }, db);
			const updated = updateItem(created.id, { priority: 'urgent' }, db);

			expect(updated.priority).toBe('urgent');
		});

		it('should update item deadline', () => {
			const created = createItem({ category_id: categoryId, user_id: userId }, db);
			const deadline = '2026-01-20T10:00:00Z';
			const updated = updateItem(created.id, { deadline }, db);

			expect(updated.deadline).toBeDefined();
		});

		it('should update is_archived', () => {
			const created = createItem({ category_id: categoryId, user_id: userId }, db);
			const updated = updateItem(created.id, { is_archived: true }, db);

			expect(updated.is_archived).toBe(true);
		});

		it('should clear nullable fields with null', () => {
			const created = createItem(
				{
					category_id: categoryId,
					user_id: userId,
					priority: 'high'
				},
				db
			);
			const updated = updateItem(created.id, { priority: null }, db);

			expect(updated.priority).toBeNull();
		});
	});

	describe('deleteItem', () => {
		it('should delete item', () => {
			const created = createItem({ category_id: categoryId, user_id: userId }, db);
			deleteItem(created.id, db);

			const item = getItemById(created.id, db);
			expect(item).toBeNull();
		});
	});

	describe('listItemsForCategory', () => {
		beforeEach(() => {
			createItem({ category_id: categoryId, user_id: userId, priority: 'urgent' }, db);
			createItem({ category_id: categoryId, user_id: userId, priority: 'high' }, db);
			createItem({ category_id: categoryId, user_id: userId, priority: 'low' }, db);
			const item = createItem({ category_id: categoryId, user_id: userId, priority: 'medium' }, db);
			updateItem(item.id, { is_archived: true }, db);
		});

		it('should list non-archived items by default', () => {
			const items = listItemsForCategory(categoryId, {}, db);
			expect(items).toHaveLength(3);
		});

		it('should include archived items when requested', () => {
			const items = listItemsForCategory(categoryId, { include_archived: true }, db);
			expect(items).toHaveLength(4);
		});

		it('should sort by priority', () => {
			const items = listItemsForCategory(categoryId, {}, db);
			expect(items[0].priority).toBe('urgent');
			expect(items[1].priority).toBe('high');
			expect(items[2].priority).toBe('low');
		});

		it('should respect limit and offset', () => {
			const items = listItemsForCategory(categoryId, { limit: 2, offset: 1 }, db);
			expect(items).toHaveLength(2);
		});
	});

	describe('listArchivedItemsForCategory', () => {
		it('should return only archived items', () => {
			createItem({ category_id: categoryId, user_id: userId }, db);
			const item1 = createItem({ category_id: categoryId, user_id: userId }, db);
			const item2 = createItem({ category_id: categoryId, user_id: userId }, db);
			updateItem(item1.id, { is_archived: true }, db);
			updateItem(item2.id, { is_archived: true }, db);

			const archived = listArchivedItemsForCategory(categoryId, {}, db);
			expect(archived).toHaveLength(2);
		});
	});

	describe('countItemsForCategory', () => {
		it('should count non-archived items', () => {
			createItem({ category_id: categoryId, user_id: userId }, db);
			createItem({ category_id: categoryId, user_id: userId }, db);
			const item = createItem({ category_id: categoryId, user_id: userId }, db);
			updateItem(item.id, { is_archived: true }, db);

			const count = countItemsForCategory(categoryId, db);
			expect(count).toBe(2);
		});
	});

	describe('completeItem', () => {
		it('should archive item when completed', () => {
			const item = createItem({ category_id: categoryId, user_id: userId }, db);
			const { completed } = completeItem(item.id, db);

			expect(completed.is_archived).toBe(true);
			expect(completed.completed_at).toBeDefined();
		});

		it('should not create next occurrence for non-recurring item', () => {
			const item = createItem({ category_id: categoryId, user_id: userId }, db);
			const { nextOccurrence } = completeItem(item.id, db);

			expect(nextOccurrence).toBeNull();
		});

		it('should throw error for non-existent item', () => {
			expect(() => completeItem(9999, db)).toThrow('Item not found');
		});
	});
});
