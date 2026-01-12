import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import {
	createCategory,
	getCategoryById,
	updateCategory,
	deleteCategory,
	listCategoriesOwnedByUser,
	listCategoriesSharedWithUser,
	listCategoriesForUser,
	listCategoryShares,
	getSharePermissionForUser,
	checkCategoryAccess,
	shareCategory,
	revokeCategoryShare
} from './categories';

describe('categories queries', () => {
	let db: Database.Database;
	let testUserId: number;
	let otherUserId: number;

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
      
      CREATE TABLE shared_access (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        shared_with_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission TEXT NOT NULL CHECK(permission IN ('view', 'edit')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category_id, shared_with_user_id)
      );
    `);

		const userResult = db
			.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
			.run('testuser', 'hash123');
		testUserId = Number(userResult.lastInsertRowid);

		const otherUserResult = db
			.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
			.run('otheruser', 'hash456');
		otherUserId = Number(otherUserResult.lastInsertRowid);
	});

	describe('getCategoryById', () => {
		it('returns category by id', () => {
			const created = createCategory(
				{
					user_id: testUserId,
					name: 'Test Category',
					template_type: 'task',
					icon: '📋',
					color: 'blue',
					is_private: true
				},
				db
			);

			const found = getCategoryById(created.id, db);

			expect(found).toBeDefined();
			expect(found?.id).toBe(created.id);
			expect(found?.name).toBe('Test Category');
			expect(found?.icon).toBe('📋');
			expect(found?.color).toBe('blue');
		});

		it('returns null for non-existent category', () => {
			const found = getCategoryById(999, db);
			expect(found).toBeNull();
		});
	});

	describe('updateCategory', () => {
		it('updates category name', () => {
			const category = createCategory(
				{
					user_id: testUserId,
					name: 'Old Name',
					template_type: 'task',
					is_private: true
				},
				db
			);

			const updated = updateCategory(category.id, { name: 'New Name' }, db);

			expect(updated.name).toBe('New Name');
			expect(updated.template_type).toBe('task');
		});

		it('updates category icon', () => {
			const category = createCategory(
				{
					user_id: testUserId,
					name: 'Category',
					template_type: 'task',
					is_private: true
				},
				db
			);

			const updated = updateCategory(category.id, { icon: '🎯' }, db);

			expect(updated.icon).toBe('🎯');
		});

		it('updates category color', () => {
			const category = createCategory(
				{
					user_id: testUserId,
					name: 'Category',
					template_type: 'task',
					is_private: true
				},
				db
			);

			const updated = updateCategory(category.id, { color: 'emerald' }, db);

			expect(updated.color).toBe('emerald');
		});

		it('updates category privacy', () => {
			const category = createCategory(
				{
					user_id: testUserId,
					name: 'Category',
					template_type: 'task',
					is_private: true
				},
				db
			);

			const updated = updateCategory(category.id, { is_private: false }, db);

			expect(updated.is_private).toBe(false);
		});

		it('updates multiple fields at once', () => {
			const category = createCategory(
				{
					user_id: testUserId,
					name: 'Old',
					template_type: 'task',
					is_private: true
				},
				db
			);

			const updated = updateCategory(
				category.id,
				{
					name: 'New',
					icon: '⭐',
					color: 'purple',
					is_private: false
				},
				db
			);

			expect(updated.name).toBe('New');
			expect(updated.icon).toBe('⭐');
			expect(updated.color).toBe('purple');
			expect(updated.is_private).toBe(false);
		});

		it('handles partial updates', () => {
			const category = createCategory(
				{
					user_id: testUserId,
					name: 'Original',
					template_type: 'chore',
					icon: '🏠',
					color: 'blue',
					is_private: true
				},
				db
			);

			const updated = updateCategory(category.id, { name: 'Updated' }, db);

			expect(updated.name).toBe('Updated');
			expect(updated.icon).toBe('🏠');
			expect(updated.color).toBe('blue');
			expect(updated.is_private).toBe(true);
		});
	});

	describe('deleteCategory', () => {
		it('deletes a category', () => {
			const category = createCategory(
				{
					user_id: testUserId,
					name: 'To Delete',
					template_type: 'task',
					is_private: true
				},
				db
			);

			deleteCategory(category.id, db);

			const found = getCategoryById(category.id, db);
			expect(found).toBeNull();
		});
	});

	describe('listCategoriesOwnedByUser', () => {
		it('returns empty array for user with no categories', () => {
			const categories = listCategoriesOwnedByUser(testUserId, db);
			expect(categories).toEqual([]);
		});

		it('returns all categories owned by user', () => {
			createCategory(
				{
					user_id: testUserId,
					name: 'Category 1',
					template_type: 'task',
					is_private: true
				},
				db
			);

			createCategory(
				{
					user_id: testUserId,
					name: 'Category 2',
					template_type: 'chore',
					is_private: true
				},
				db
			);

			const categories = listCategoriesOwnedByUser(testUserId, db);

			expect(categories).toHaveLength(2);
			const names = categories.map((c) => c.name).sort();
			expect(names).toEqual(['Category 1', 'Category 2']);
		});

		it('only returns categories owned by specific user', () => {
			createCategory(
				{
					user_id: testUserId,
					name: 'User 1 Category',
					template_type: 'task',
					is_private: true
				},
				db
			);

			createCategory(
				{
					user_id: otherUserId,
					name: 'User 2 Category',
					template_type: 'task',
					is_private: true
				},
				db
			);

			const categories = listCategoriesOwnedByUser(testUserId, db);

			expect(categories).toHaveLength(1);
			expect(categories[0].name).toBe('User 1 Category');
		});
	});

	describe('listCategoriesSharedWithUser', () => {
		it('returns empty array for user with no shared categories', () => {
			const categories = listCategoriesSharedWithUser(testUserId, db);
			expect(categories).toEqual([]);
		});

		it('returns categories shared with user', () => {
			const category = createCategory(
				{
					user_id: otherUserId,
					name: 'Shared Category',
					template_type: 'task',
					is_private: false
				},
				db
			);

			db.prepare(
				'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
			).run(category.id, testUserId, 'view');

			const categories = listCategoriesSharedWithUser(testUserId, db);

			expect(categories).toHaveLength(1);
			expect(categories[0].name).toBe('Shared Category');
			expect(categories[0].permission).toBe('view');
		});

		it('includes permission level in shared categories', () => {
			const category = createCategory(
				{
					user_id: otherUserId,
					name: 'Editable Category',
					template_type: 'task',
					is_private: false
				},
				db
			);

			db.prepare(
				'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
			).run(category.id, testUserId, 'edit');

			const categories = listCategoriesSharedWithUser(testUserId, db);

			expect(categories).toHaveLength(1);
			expect(categories[0].permission).toBe('edit');
		});
	});

	describe('listCategoriesForUser', () => {
		it('returns both owned and shared categories', () => {
			const ownedCategory = createCategory(
				{
					user_id: testUserId,
					name: 'Owned',
					template_type: 'task',
					is_private: true
				},
				db
			);

			const sharedCategory = createCategory(
				{
					user_id: otherUserId,
					name: 'Shared',
					template_type: 'chore',
					is_private: false
				},
				db
			);

			db.prepare(
				'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
			).run(sharedCategory.id, testUserId, 'view');

			const result = listCategoriesForUser(testUserId, db);

			expect(result.owned).toHaveLength(1);
			expect(result.shared).toHaveLength(1);
			expect(result.owned[0].id).toBe(ownedCategory.id);
			expect(result.shared[0].id).toBe(sharedCategory.id);
		});

		it('returns empty arrays when user has no categories', () => {
			const result = listCategoriesForUser(testUserId, db);

			expect(result.owned).toEqual([]);
			expect(result.shared).toEqual([]);
		});
	});

	describe('sharing helpers', () => {
		it('lists shares for a category with usernames', () => {
			const category = createCategory(
				{
					user_id: testUserId,
					name: 'Sharable',
					template_type: 'task',
					is_private: true
				},
				db
			);

			db.prepare(
				'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
			).run(category.id, otherUserId, 'edit');

			const shares = listCategoryShares(category.id, db);
			expect(shares).toEqual([{ user_id: otherUserId, username: 'otheruser', permission: 'edit' }]);
		});

		it('gets share permission for a user', () => {
			const category = createCategory(
				{
					user_id: testUserId,
					name: 'Sharable',
					template_type: 'task',
					is_private: true
				},
				db
			);

			expect(getSharePermissionForUser(category.id, otherUserId, db)).toBeNull();

			db.prepare(
				'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
			).run(category.id, otherUserId, 'view');

			expect(getSharePermissionForUser(category.id, otherUserId, db)).toBe('view');
		});

		it('checks category access for owner and shared users', () => {
			const category = createCategory(
				{
					user_id: testUserId,
					name: 'Sharable',
					template_type: 'task',
					is_private: true
				},
				db
			);

			// Owner has full access
			expect(checkCategoryAccess(testUserId, category.id, 'view', db)).toBe(true);
			expect(checkCategoryAccess(testUserId, category.id, 'edit', db)).toBe(true);

			// No share => no access
			expect(checkCategoryAccess(otherUserId, category.id, 'view', db)).toBe(false);

			// view share => view ok, edit not ok
			db.prepare(
				'INSERT INTO shared_access (category_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
			).run(category.id, otherUserId, 'view');

			expect(checkCategoryAccess(otherUserId, category.id, 'view', db)).toBe(true);
			expect(checkCategoryAccess(otherUserId, category.id, 'edit', db)).toBe(false);
		});

		it('shareCategory inserts and revokeCategoryShare removes access', () => {
			const category = createCategory(
				{
					user_id: testUserId,
					name: 'Sharable',
					template_type: 'task',
					is_private: true
				},
				db
			);

			shareCategory(category.id, otherUserId, 'edit', db);
			expect(getSharePermissionForUser(category.id, otherUserId, db)).toBe('edit');

			revokeCategoryShare(category.id, otherUserId, db);
			expect(getSharePermissionForUser(category.id, otherUserId, db)).toBeNull();
		});
	});
});
