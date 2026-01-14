import { getDb } from '../../db';
import { dbSchemas, type FieldValue } from './types';
import type { Db } from './utils';
import { parseRow } from './utils';

export function getFieldValuesForItem(itemId: number, db: Db = getDb()): FieldValue[] {
	const rows = db
		.prepare('SELECT * FROM field_values WHERE item_id = ? ORDER BY field_id')
		.all(itemId);
	return rows.map((r) => parseRow(dbSchemas.fieldValueSchema, r));
}

export function getFieldValuesAsRecord(itemId: number, db: Db = getDb()): Record<string, string> {
	const values = getFieldValuesForItem(itemId, db);
	const record: Record<string, string> = {};
	for (const fv of values) {
		if (fv.value !== null) {
			record[fv.field_id.toString()] = fv.value;
		}
	}
	return record;
}

export function upsertFieldValues(
	itemId: number,
	values: Record<string, string>,
	db: Db = getDb()
): void {
	const upsert = db.transaction(() => {
		db.prepare('DELETE FROM field_values WHERE item_id = ?').run(itemId);

		if (Object.keys(values).length > 0) {
			const stmt = db.prepare(
				'INSERT INTO field_values (item_id, field_id, value) VALUES (?, ?, ?)'
			);
			for (const [fieldId, value] of Object.entries(values)) {
				stmt.run(itemId, Number(fieldId), value);
			}
		}
	});

	upsert();
}

export function deleteFieldValuesForItem(itemId: number, db: Db = getDb()): void {
	db.prepare('DELETE FROM field_values WHERE item_id = ?').run(itemId);
}
