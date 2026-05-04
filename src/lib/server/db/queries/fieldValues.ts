import { getDb } from '../../db';
import { dbSchemas, type FieldValue } from './types';
import type { Db } from './utils';
import { parseRow } from './utils';

export async function getFieldValuesForItem(
	itemId: number,
	sql: Db = getDb()
): Promise<FieldValue[]> {
	const rows = await sql`SELECT * FROM field_values WHERE item_id = ${itemId} ORDER BY field_id`;
	return rows.map((r) => parseRow(dbSchemas.fieldValueSchema, r));
}

export async function getFieldValuesAsRecord(
	itemId: number,
	sql: Db = getDb()
): Promise<Record<string, string>> {
	const values = await getFieldValuesForItem(itemId, sql);
	const record: Record<string, string> = {};
	for (const fv of values) {
		if (fv.value !== null) {
			record[fv.field_id.toString()] = fv.value;
		}
	}
	return record;
}

export async function upsertFieldValues(
	itemId: number,
	values: Record<string, string>,
	sql: Db = getDb()
): Promise<void> {
	await sql`DELETE FROM field_values WHERE item_id = ${itemId}`;
	if (Object.keys(values).length > 0) {
		const rows = Object.entries(values).map(([fieldId, value]) => ({
			item_id: itemId,
			field_id: Number(fieldId),
			value
		}));
		await sql`INSERT INTO field_values ${sql(rows)}`;
	}
}

export async function deleteFieldValuesForItem(itemId: number, sql: Db = getDb()): Promise<void> {
	await sql`DELETE FROM field_values WHERE item_id = ${itemId}`;
}
