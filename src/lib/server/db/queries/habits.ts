import { getDb } from '../../db';
import {
	dbSchemas,
	type HabitEntry,
	type ListEntriesOptions,
	type UpsertHabitEntryInput
} from './types';
import type { Db } from './utils';
import { parseRow, parseOptionalRow } from './utils';
import { calculateStreak, calculateLongestStreak, calculateFrequency } from '$lib/utils/streaks';
import type { HabitStats } from '$lib/schemas/habits';

export function upsertHabitEntry(input: UpsertHabitEntryInput, db: Db = getDb()): HabitEntry {
	db.prepare(
		`INSERT INTO habit_entries (item_id, logged_date, status, notes)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(item_id, logged_date) DO UPDATE SET
       status = excluded.status,
       notes = excluded.notes`
	).run(input.item_id, input.logged_date, input.status, input.notes ?? null);

	const row = db
		.prepare('SELECT * FROM habit_entries WHERE item_id = ? AND logged_date = ?')
		.get(input.item_id, input.logged_date);
	return parseRow(dbSchemas.habitEntrySchema, row);
}

export function listHabitEntries(
	itemId: number,
	opts: ListEntriesOptions & { from_date?: string; to_date?: string } = {},
	db: Db = getDb()
): HabitEntry[] {
	const limit = opts.limit ?? 365;
	const offset = opts.offset ?? 0;

	let query = 'SELECT * FROM habit_entries WHERE item_id = ?';
	const params: unknown[] = [itemId];

	if (opts.from_date) {
		query += ' AND logged_date >= ?';
		params.push(opts.from_date);
	}

	if (opts.to_date) {
		query += ' AND logged_date <= ?';
		params.push(opts.to_date);
	}

	query += ' ORDER BY logged_date DESC LIMIT ? OFFSET ?';
	params.push(limit, offset);

	const rows = db.prepare(query).all(...params);
	return rows.map((r) => parseRow(dbSchemas.habitEntrySchema, r));
}

export function getHabitEntry(
	itemId: number,
	loggedDate: string,
	db: Db = getDb()
): HabitEntry | null {
	const row = db
		.prepare('SELECT * FROM habit_entries WHERE item_id = ? AND logged_date = ?')
		.get(itemId, loggedDate);
	return parseOptionalRow(dbSchemas.habitEntrySchema, row) ?? null;
}

export function deleteHabitEntry(itemId: number, loggedDate: string, db: Db = getDb()): void {
	db.prepare('DELETE FROM habit_entries WHERE item_id = ? AND logged_date = ?').run(
		itemId,
		loggedDate
	);
}

export function getHabitStats(itemId: number, db: Db = getDb()): HabitStats {
	const oneYearAgo = new Date();
	oneYearAgo.setDate(oneYearAgo.getDate() - 365);
	const fromDate = oneYearAgo.toISOString().split('T')[0];

	const entries = listHabitEntries(itemId, { from_date: fromDate, limit: 365 }, db);

	const currentStreak = calculateStreak(entries);
	const longestStreak = calculateLongestStreak(entries);
	const last7Days = calculateFrequency(entries, 7);
	const last30Days = calculateFrequency(entries, 30);

	return {
		current_streak: currentStreak,
		longest_streak: longestStreak,
		total_entries: entries.length,
		last_7_days: last7Days,
		last_30_days: last30Days
	};
}
