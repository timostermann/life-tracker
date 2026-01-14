import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import {
	getFieldValuesForItem,
	getFieldValuesAsRecord,
	upsertFieldValues,
	deleteFieldValuesForItem
} from './fieldValues';
import { createItem } from './items';
import { createCategory } from './categories';
import { createField } from './fields';
import { createUser } from './users';

describe('fieldValues queries', () => {
	let db: Database.Database;
	let userId: number;
	let categoryId: number;
	let field1Id: number;
	let field2Id: number;
	let itemId: number;

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
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        field_type TEXT NOT NULL,
        options TEXT,
        field_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE field_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        field_id INTEGER NOT NULL,
        value TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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

		const field1 = createField(
			{
				category_id: categoryId,
				name: 'Title',
				field_type: 'text',
				field_order: 0
			},
			db
		);
		field1Id = field1.id;

		const field2 = createField(
			{
				category_id: categoryId,
				name: 'Description',
				field_type: 'text',
				field_order: 1
			},
			db
		);
		field2Id = field2.id;

		const item = createItem(
			{
				category_id: categoryId,
				user_id: userId
			},
			db
		);
		itemId = item.id;
	});

	afterEach(() => {
		db.close();
	});

	describe('getFieldValuesForItem', () => {
		it('should return empty array when no values exist', () => {
			const values = getFieldValuesForItem(itemId, db);
			expect(values).toEqual([]);
		});

		it('should return field values for item', () => {
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field1Id,
				'Test Title'
			);
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field2Id,
				'Test Description'
			);

			const values = getFieldValuesForItem(itemId, db);
			expect(values).toHaveLength(2);
			expect(values[0].field_id).toBe(field1Id);
			expect(values[0].value).toBe('Test Title');
		});

		it('should order by field_id', () => {
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field2Id,
				'Description'
			);
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field1Id,
				'Title'
			);

			const values = getFieldValuesForItem(itemId, db);
			expect(values[0].field_id).toBe(field1Id);
			expect(values[1].field_id).toBe(field2Id);
		});
	});

	describe('getFieldValuesAsRecord', () => {
		it('should return empty object when no values exist', () => {
			const record = getFieldValuesAsRecord(itemId, db);
			expect(record).toEqual({});
		});

		it('should return record with field_id as keys', () => {
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field1Id,
				'Test Title'
			);
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field2Id,
				'Test Description'
			);

			const record = getFieldValuesAsRecord(itemId, db);
			expect(record[field1Id.toString()]).toBe('Test Title');
			expect(record[field2Id.toString()]).toBe('Test Description');
		});

		it('should skip null values', () => {
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field1Id,
				null
			);

			const record = getFieldValuesAsRecord(itemId, db);
			expect(record[field1Id.toString()]).toBeUndefined();
		});
	});

	describe('upsertFieldValues', () => {
		it('should insert new field values', () => {
			upsertFieldValues(
				itemId,
				{
					[field1Id]: 'New Title',
					[field2Id]: 'New Description'
				},
				db
			);

			const values = getFieldValuesForItem(itemId, db);
			expect(values).toHaveLength(2);
		});

		it('should replace existing field values', () => {
			// Insert initial values
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field1Id,
				'Old Title'
			);

			// Upsert with new values
			upsertFieldValues(
				itemId,
				{
					[field1Id]: 'New Title',
					[field2Id]: 'New Description'
				},
				db
			);

			const record = getFieldValuesAsRecord(itemId, db);
			expect(record[field1Id.toString()]).toBe('New Title');
			expect(record[field2Id.toString()]).toBe('New Description');
		});

		it('should delete old values not in new set', () => {
			// Insert initial values
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field1Id,
				'Title'
			);
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field2Id,
				'Description'
			);

			// Upsert with only one field
			upsertFieldValues(itemId, { [field1Id]: 'New Title' }, db);

			const values = getFieldValuesForItem(itemId, db);
			expect(values).toHaveLength(1);
			expect(values[0].field_id).toBe(field1Id);
		});

		it('should handle empty values object', () => {
			// Insert initial value
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field1Id,
				'Title'
			);

			// Upsert with empty object should delete all
			upsertFieldValues(itemId, {}, db);

			const values = getFieldValuesForItem(itemId, db);
			expect(values).toHaveLength(0);
		});
	});

	describe('deleteFieldValuesForItem', () => {
		it('should delete all field values for item', () => {
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field1Id,
				'Title'
			);
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field2Id,
				'Description'
			);

			deleteFieldValuesForItem(itemId, db);

			const values = getFieldValuesForItem(itemId, db);
			expect(values).toHaveLength(0);
		});

		it('should not affect other items', () => {
			const item2 = createItem({ category_id: categoryId, user_id: userId }, db);

			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				itemId,
				field1Id,
				'Title 1'
			);
			db.prepare('INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)').run(
				item2.id,
				field1Id,
				'Title 2'
			);

			deleteFieldValuesForItem(itemId, db);

			const values1 = getFieldValuesForItem(itemId, db);
			const values2 = getFieldValuesForItem(item2.id, db);

			expect(values1).toHaveLength(0);
			expect(values2).toHaveLength(1);
		});
	});
});
