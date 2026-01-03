import { getDb } from '../../db';
import {
	dbSchemas,
	type HabitEntry,
	type ListEntriesOptions,
	type UpsertHabitEntryInput
} from './types';
import type { Db } from './utils';
import { parseRow } from './utils';

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
		.get(input.item_id, input.logged_date) as unknown;
	return parseRow(dbSchemas.habitEntrySchema, row);
}

export function listHabitEntries(
	itemId: number,
	opts: ListEntriesOptions = {},
	db: Db = getDb()
): HabitEntry[] {
	const limit = opts.limit ?? 100;
	const offset = opts.offset ?? 0;
	const rows = db
		.prepare(
			`SELECT * FROM habit_entries
       WHERE item_id = ?
       ORDER BY logged_date DESC
       LIMIT ? OFFSET ?`
		)
		.all(itemId, limit, offset) as unknown[];

	return rows.map((r) => parseRow(dbSchemas.habitEntrySchema, r));
}
