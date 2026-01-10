import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import {
	createField,
	createFields,
	listFieldsForCategory,
	updateField,
	deleteField,
	deleteFieldsForCategory
} from './fields';
import { createCategory } from './categories';
import type { CreateFieldInput } from './types';

describe('fields queries', () => {
	let db: Database.Database;
	let testUserId: number;
	let testCategoryId: number;

	beforeEach(() => {
		db = new Database(':memory:');
		db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
        field_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

		const userResult = db
			.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
			.run('testuser', 'hash123');
		testUserId = Number(userResult.lastInsertRowid);

		const category = createCategory(
			{
				user_id: testUserId,
				name: 'Test Category',
				template_type: 'task',
				is_private: true
			},
			db
		);
		testCategoryId = category.id;
	});

	describe('createField', () => {
		it('creates a text field', () => {
			const fieldInput: CreateFieldInput = {
				category_id: testCategoryId,
				name: 'Description',
				field_type: 'text',
				field_order: 0
			};

			const field = createField(fieldInput, db);

			expect(field.id).toBeDefined();
			expect(field.category_id).toBe(testCategoryId);
			expect(field.name).toBe('Description');
			expect(field.field_type).toBe('text');
			expect(field.options).toBeNull();
			expect(field.field_order).toBe(0);
		});

		it('creates a select field with options', () => {
			const fieldInput: CreateFieldInput = {
				category_id: testCategoryId,
				name: 'Priority',
				field_type: 'select',
				options: 'Low,Medium,High',
				field_order: 1
			};

			const field = createField(fieldInput, db);

			expect(field.name).toBe('Priority');
			expect(field.field_type).toBe('select');
			expect(field.options).toBe('Low,Medium,High');
			expect(field.field_order).toBe(1);
		});

		it('creates a number field', () => {
			const fieldInput: CreateFieldInput = {
				category_id: testCategoryId,
				name: 'Count',
				field_type: 'number',
				field_order: 2
			};

			const field = createField(fieldInput, db);

			expect(field.field_type).toBe('number');
		});

		it('creates a date field', () => {
			const fieldInput: CreateFieldInput = {
				category_id: testCategoryId,
				name: 'Due Date',
				field_type: 'date',
				field_order: 3
			};

			const field = createField(fieldInput, db);

			expect(field.field_type).toBe('date');
		});

		it('creates a boolean field', () => {
			const fieldInput: CreateFieldInput = {
				category_id: testCategoryId,
				name: 'Is Complete',
				field_type: 'boolean',
				field_order: 4
			};

			const field = createField(fieldInput, db);

			expect(field.field_type).toBe('boolean');
		});
	});

	describe('createFields', () => {
		it('creates multiple fields at once', () => {
			const fieldsInput: CreateFieldInput[] = [
				{
					category_id: testCategoryId,
					name: 'Field 1',
					field_type: 'text',
					field_order: 0
				},
				{
					category_id: testCategoryId,
					name: 'Field 2',
					field_type: 'number',
					field_order: 1
				},
				{
					category_id: testCategoryId,
					name: 'Field 3',
					field_type: 'select',
					options: 'A,B,C',
					field_order: 2
				}
			];

			createFields(fieldsInput, db);

			const fields = listFieldsForCategory(testCategoryId, db);

			expect(fields).toHaveLength(3);
			expect(fields[0].name).toBe('Field 1');
			expect(fields[1].name).toBe('Field 2');
			expect(fields[2].name).toBe('Field 3');
			expect(fields[2].options).toBe('A,B,C');
		});

		it('handles empty array', () => {
			createFields([], db);

			const fields = listFieldsForCategory(testCategoryId, db);
			expect(fields).toHaveLength(0);
		});
	});

	describe('listFieldsForCategory', () => {
		it('returns empty array for category with no fields', () => {
			const fields = listFieldsForCategory(testCategoryId, db);
			expect(fields).toEqual([]);
		});

		it('returns all fields for a category', () => {
			createField(
				{
					category_id: testCategoryId,
					name: 'Field 1',
					field_type: 'text',
					field_order: 0
				},
				db
			);

			createField(
				{
					category_id: testCategoryId,
					name: 'Field 2',
					field_type: 'number',
					field_order: 1
				},
				db
			);

			const fields = listFieldsForCategory(testCategoryId, db);

			expect(fields).toHaveLength(2);
			expect(fields[0].name).toBe('Field 1');
			expect(fields[1].name).toBe('Field 2');
		});

		it('returns fields ordered by field_order', () => {
			createField(
				{
					category_id: testCategoryId,
					name: 'Third',
					field_type: 'text',
					field_order: 2
				},
				db
			);

			createField(
				{
					category_id: testCategoryId,
					name: 'First',
					field_type: 'text',
					field_order: 0
				},
				db
			);

			createField(
				{
					category_id: testCategoryId,
					name: 'Second',
					field_type: 'text',
					field_order: 1
				},
				db
			);

			const fields = listFieldsForCategory(testCategoryId, db);

			expect(fields).toHaveLength(3);
			expect(fields[0].name).toBe('First');
			expect(fields[1].name).toBe('Second');
			expect(fields[2].name).toBe('Third');
		});
	});

	describe('updateField', () => {
		it('updates field name', () => {
			const field = createField(
				{
					category_id: testCategoryId,
					name: 'Old Name',
					field_type: 'text',
					field_order: 0
				},
				db
			);

			const updated = updateField(field.id, { name: 'New Name' }, db);

			expect(updated.name).toBe('New Name');
			expect(updated.field_type).toBe('text');
		});

		it('updates field type', () => {
			const field = createField(
				{
					category_id: testCategoryId,
					name: 'Field',
					field_type: 'text',
					field_order: 0
				},
				db
			);

			const updated = updateField(field.id, { field_type: 'number' }, db);

			expect(updated.field_type).toBe('number');
		});

		it('updates field options', () => {
			const field = createField(
				{
					category_id: testCategoryId,
					name: 'Priority',
					field_type: 'select',
					options: 'Low,High',
					field_order: 0
				},
				db
			);

			const updated = updateField(field.id, { options: 'Low,Medium,High,Critical' }, db);

			expect(updated.options).toBe('Low,Medium,High,Critical');
		});

		it('updates field order', () => {
			const field = createField(
				{
					category_id: testCategoryId,
					name: 'Field',
					field_type: 'text',
					field_order: 0
				},
				db
			);

			const updated = updateField(field.id, { field_order: 5 }, db);

			expect(updated.field_order).toBe(5);
		});

		it('updates multiple properties at once', () => {
			const field = createField(
				{
					category_id: testCategoryId,
					name: 'Old',
					field_type: 'text',
					field_order: 0
				},
				db
			);

			const updated = updateField(
				field.id,
				{
					name: 'New',
					field_type: 'select',
					options: 'A,B,C',
					field_order: 3
				},
				db
			);

			expect(updated.name).toBe('New');
			expect(updated.field_type).toBe('select');
			expect(updated.options).toBe('A,B,C');
			expect(updated.field_order).toBe(3);
		});

		it('handles partial updates', () => {
			const field = createField(
				{
					category_id: testCategoryId,
					name: 'Original',
					field_type: 'text',
					options: 'A,B',
					field_order: 0
				},
				db
			);

			const updated = updateField(field.id, { name: 'Updated' }, db);

			expect(updated.name).toBe('Updated');
			expect(updated.field_type).toBe('text');
			expect(updated.options).toBe('A,B');
			expect(updated.field_order).toBe(0);
		});

		it('returns field unchanged when no updates provided', () => {
			const field = createField(
				{
					category_id: testCategoryId,
					name: 'Field',
					field_type: 'text',
					field_order: 0
				},
				db
			);

			const updated = updateField(field.id, {}, db);

			expect(updated.id).toBe(field.id);
			expect(updated.name).toBe('Field');
			expect(updated.field_type).toBe('text');
		});
	});

	describe('deleteField', () => {
		it('deletes a field', () => {
			const field = createField(
				{
					category_id: testCategoryId,
					name: 'To Delete',
					field_type: 'text',
					field_order: 0
				},
				db
			);

			deleteField(field.id, db);

			const fields = listFieldsForCategory(testCategoryId, db);
			expect(fields).toHaveLength(0);
		});

		it('only deletes the specified field', () => {
			const field1 = createField(
				{
					category_id: testCategoryId,
					name: 'Keep',
					field_type: 'text',
					field_order: 0
				},
				db
			);

			const field2 = createField(
				{
					category_id: testCategoryId,
					name: 'Delete',
					field_type: 'text',
					field_order: 1
				},
				db
			);

			deleteField(field2.id, db);

			const fields = listFieldsForCategory(testCategoryId, db);
			expect(fields).toHaveLength(1);
			expect(fields[0].id).toBe(field1.id);
		});
	});

	describe('deleteFieldsForCategory', () => {
		it('deletes all fields for a category', () => {
			createField(
				{
					category_id: testCategoryId,
					name: 'Field 1',
					field_type: 'text',
					field_order: 0
				},
				db
			);

			createField(
				{
					category_id: testCategoryId,
					name: 'Field 2',
					field_type: 'number',
					field_order: 1
				},
				db
			);

			deleteFieldsForCategory(testCategoryId, db);

			const fields = listFieldsForCategory(testCategoryId, db);
			expect(fields).toHaveLength(0);
		});

		it('only deletes fields for the specified category', () => {
			const category2 = createCategory(
				{
					user_id: testUserId,
					name: 'Category 2',
					template_type: 'chore',
					is_private: true
				},
				db
			);

			createField(
				{
					category_id: testCategoryId,
					name: 'Category 1 Field',
					field_type: 'text',
					field_order: 0
				},
				db
			);

			createField(
				{
					category_id: category2.id,
					name: 'Category 2 Field',
					field_type: 'text',
					field_order: 0
				},
				db
			);

			deleteFieldsForCategory(testCategoryId, db);

			const fields1 = listFieldsForCategory(testCategoryId, db);
			const fields2 = listFieldsForCategory(category2.id, db);

			expect(fields1).toHaveLength(0);
			expect(fields2).toHaveLength(1);
		});

		it('handles category with no fields', () => {
			expect(() => deleteFieldsForCategory(testCategoryId, db)).not.toThrow();

			const fields = listFieldsForCategory(testCategoryId, db);
			expect(fields).toHaveLength(0);
		});
	});
});
