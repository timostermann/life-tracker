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

export async function upsertHabitEntry(
	input: UpsertHabitEntryInput,
	sql: Db = getDb()
): Promise<HabitEntry> {
	await sql`
		INSERT INTO habit_entries (item_id, logged_date, status, notes)
		VALUES (${input.item_id}, ${input.logged_date}, ${input.status}, ${input.notes ?? null})
		ON CONFLICT(item_id, logged_date) DO UPDATE SET
			status = EXCLUDED.status,
			notes = EXCLUDED.notes
	`;
	const [row] = await sql`
		SELECT * FROM habit_entries WHERE item_id = ${input.item_id} AND logged_date = ${input.logged_date}
	`;
	return parseRow(dbSchemas.habitEntrySchema, row);
}

export async function listHabitEntries(
	itemId: number,
	opts: ListEntriesOptions & { from_date?: string; to_date?: string } = {},
	sql: Db = getDb()
): Promise<HabitEntry[]> {
	const limit = opts.limit ?? 365;
	const offset = opts.offset ?? 0;

	const fromFilter = opts.from_date ? sql`AND logged_date >= ${opts.from_date}` : sql``;
	const toFilter = opts.to_date ? sql`AND logged_date <= ${opts.to_date}` : sql``;

	const rows = await sql`
		SELECT * FROM habit_entries
		WHERE item_id = ${itemId}
		${fromFilter}
		${toFilter}
		ORDER BY logged_date DESC
		LIMIT ${limit} OFFSET ${offset}
	`;
	return rows.map((r) => parseRow(dbSchemas.habitEntrySchema, r));
}

export async function getHabitEntry(
	itemId: number,
	loggedDate: string,
	sql: Db = getDb()
): Promise<HabitEntry | null> {
	const [row] = await sql`
		SELECT * FROM habit_entries WHERE item_id = ${itemId} AND logged_date = ${loggedDate}
	`;
	return parseOptionalRow(dbSchemas.habitEntrySchema, row) ?? null;
}

export async function deleteHabitEntry(
	itemId: number,
	loggedDate: string,
	sql: Db = getDb()
): Promise<void> {
	await sql`DELETE FROM habit_entries WHERE item_id = ${itemId} AND logged_date = ${loggedDate}`;
}

export async function getHabitStats(itemId: number, sql: Db = getDb()): Promise<HabitStats> {
	const oneYearAgo = new Date();
	oneYearAgo.setDate(oneYearAgo.getDate() - 365);
	const fromDate = oneYearAgo.toISOString().split('T')[0];

	const entries = await listHabitEntries(itemId, { from_date: fromDate, limit: 365 }, sql);

	return {
		current_streak: calculateStreak(entries),
		longest_streak: calculateLongestStreak(entries),
		total_entries: entries.length,
		last_7_days: calculateFrequency(entries, 7),
		last_30_days: calculateFrequency(entries, 30)
	};
}
