import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import {
	upsertHabitEntry,
	listHabitEntries,
	getHabitEntry,
	deleteHabitEntry,
	getHabitStats
} from './habits';
import { createItem } from './items';
import { createCategory } from './categories';
import { createUser } from './users';

describe('habits queries', () => {
	let db: Database.Database;
	let userId: number;
	let categoryId: number;
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
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
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

      CREATE TABLE habit_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        logged_date DATE NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('done', 'skipped', 'failed')),
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        UNIQUE(item_id, logged_date)
      );

      CREATE INDEX idx_habit_entries_item_id ON habit_entries(item_id);
      CREATE INDEX idx_habit_entries_date ON habit_entries(logged_date DESC);
      CREATE INDEX idx_habit_entries_item_date ON habit_entries(item_id, logged_date);
    `);

		userId = createUser(
			{
				username: 'testuser',
				password_hash: 'hash'
			},
			db
		).id;

		categoryId = createCategory(
			{
				user_id: userId,
				name: 'Test Habits',
				template_type: 'habit'
			},
			db
		).id;

		itemId = createItem(
			{
				category_id: categoryId,
				user_id: userId,
				assigned_to_user_id: null,
				priority: null,
				deadline: null,
				time_estimate: null,
				recurring_config: null,
				next_show_date: null,
				field_values: []
			},
			db
		).id;
	});

	afterEach(() => {
		db.close();
	});

	describe('upsertHabitEntry', () => {
		it('creates a new entry', () => {
			const entry = upsertHabitEntry(
				{
					item_id: itemId,
					logged_date: '2024-01-01',
					status: 'done',
					notes: 'Great day!'
				},
				db
			);

			expect(entry.item_id).toBe(itemId);
			expect(entry.logged_date).toBe('2024-01-01');
			expect(entry.status).toBe('done');
			expect(entry.notes).toBe('Great day!');
		});

		it('updates existing entry', () => {
			upsertHabitEntry(
				{
					item_id: itemId,
					logged_date: '2024-01-01',
					status: 'done',
					notes: 'First note'
				},
				db
			);

			const updated = upsertHabitEntry(
				{
					item_id: itemId,
					logged_date: '2024-01-01',
					status: 'skipped',
					notes: 'Updated note'
				},
				db
			);

			expect(updated.status).toBe('skipped');
			expect(updated.notes).toBe('Updated note');
		});
	});

	describe('getHabitEntry', () => {
		it('returns entry when found', () => {
			upsertHabitEntry(
				{
					item_id: itemId,
					logged_date: '2024-01-01',
					status: 'done',
					notes: 'Test'
				},
				db
			);

			const entry = getHabitEntry(itemId, '2024-01-01', db);
			expect(entry).not.toBeNull();
			expect(entry?.status).toBe('done');
		});

		it('returns null when not found', () => {
			const entry = getHabitEntry(itemId, '2024-01-01', db);
			expect(entry).toBeNull();
		});
	});

	describe('listHabitEntries', () => {
		it('returns all entries for item', () => {
			upsertHabitEntry(
				{
					item_id: itemId,
					logged_date: '2024-01-01',
					status: 'done',
					notes: null
				},
				db
			);
			upsertHabitEntry(
				{
					item_id: itemId,
					logged_date: '2024-01-02',
					status: 'done',
					notes: null
				},
				db
			);

			const entries = listHabitEntries(itemId, {}, db);
			expect(entries.length).toBe(2);
		});

		it('filters by date range', () => {
			upsertHabitEntry(
				{
					item_id: itemId,
					logged_date: '2024-01-01',
					status: 'done',
					notes: null
				},
				db
			);
			upsertHabitEntry(
				{
					item_id: itemId,
					logged_date: '2024-01-15',
					status: 'done',
					notes: null
				},
				db
			);

			const entries = listHabitEntries(
				itemId,
				{ from_date: '2024-01-10', to_date: '2024-01-20' },
				db
			);
			expect(entries.length).toBe(1);
			expect(entries[0].logged_date).toBe('2024-01-15');
		});
	});

	describe('deleteHabitEntry', () => {
		it('deletes entry', () => {
			upsertHabitEntry(
				{
					item_id: itemId,
					logged_date: '2024-01-01',
					status: 'done',
					notes: null
				},
				db
			);

			deleteHabitEntry(itemId, '2024-01-01', db);

			const entry = getHabitEntry(itemId, '2024-01-01', db);
			expect(entry).toBeNull();
		});
	});

	describe('getHabitStats', () => {
		it('calculates stats correctly', () => {
			const today = new Date();
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);
			const twoDaysAgo = new Date(today);
			twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

			upsertHabitEntry(
				{
					item_id: itemId,
					logged_date: twoDaysAgo.toISOString().split('T')[0],
					status: 'done',
					notes: null
				},
				db
			);
			upsertHabitEntry(
				{
					item_id: itemId,
					logged_date: yesterday.toISOString().split('T')[0],
					status: 'done',
					notes: null
				},
				db
			);
			upsertHabitEntry(
				{
					item_id: itemId,
					logged_date: today.toISOString().split('T')[0],
					status: 'done',
					notes: null
				},
				db
			);

			const stats = getHabitStats(itemId, db);
			expect(stats.current_streak).toBeGreaterThan(0);
			expect(stats.total_entries).toBe(3);
			expect(stats.last_7_days.done).toBeGreaterThan(0);
		});

		it('returns zero stats for empty entries', () => {
			const stats = getHabitStats(itemId, db);
			expect(stats.current_streak).toBe(0);
			expect(stats.longest_streak).toBe(0);
			expect(stats.total_entries).toBe(0);
		});
	});
});
