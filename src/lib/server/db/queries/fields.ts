import { getDb } from '../../db';
import { dbSchemas, type CreateFieldInput, type UpdateFieldInput, type Field } from './types';
import type { Db } from './utils';
import { parseRow } from './utils';

export function listFieldsForCategory(categoryId: number, db: Db = getDb()): Field[] {
	const rows = db
		.prepare('SELECT * FROM fields WHERE category_id = ? ORDER BY field_order ASC')
		.all(categoryId);
	return rows.map((r) => parseRow(dbSchemas.fieldSchema, r));
}

export function createField(input: CreateFieldInput, db: Db = getDb()): Field {
	const res = db
		.prepare(
			`INSERT INTO fields (category_id, name, field_type, options, field_order)
       VALUES (?, ?, ?, ?, ?)`
		)
		.run(input.category_id, input.name, input.field_type, input.options ?? null, input.field_order);

	const row = db.prepare('SELECT * FROM fields WHERE id = ?').get(Number(res.lastInsertRowid));
	return parseRow(dbSchemas.fieldSchema, row);
}

export function createFields(input: CreateFieldInput[], db: Db = getDb()) {
	const stmt = db.prepare(
		`INSERT INTO fields (category_id, name, field_type, options, field_order)
     VALUES (?, ?, ?, ?, ?)`
	);
	const insertMany = db.transaction((rows: CreateFieldInput[]) => {
		for (const row of rows) {
			stmt.run(row.category_id, row.name, row.field_type, row.options ?? null, row.field_order);
		}
	});
	insertMany(input);
}

export function updateField(fieldId: number, input: UpdateFieldInput, db: Db = getDb()): Field {
	const updates: string[] = [];
	const values: unknown[] = [];

	if (input.name !== undefined) {
		updates.push('name = ?');
		values.push(input.name);
	}
	if (input.field_type !== undefined) {
		updates.push('field_type = ?');
		values.push(input.field_type);
	}
	if (input.options !== undefined) {
		updates.push('options = ?');
		values.push(input.options);
	}
	if (input.field_order !== undefined) {
		updates.push('field_order = ?');
		values.push(input.field_order);
	}

	if (updates.length === 0) {
		const row = db.prepare('SELECT * FROM fields WHERE id = ?').get(fieldId);
		return parseRow(dbSchemas.fieldSchema, row);
	}

	values.push(fieldId);
	db.prepare(`UPDATE fields SET ${updates.join(', ')} WHERE id = ?`).run(...values);

	const row = db.prepare('SELECT * FROM fields WHERE id = ?').get(fieldId);
	return parseRow(dbSchemas.fieldSchema, row);
}

export function deleteField(fieldId: number, db: Db = getDb()): void {
	db.prepare('DELETE FROM fields WHERE id = ?').run(fieldId);
}

export function deleteFieldsForCategory(categoryId: number, db: Db = getDb()): void {
	db.prepare('DELETE FROM fields WHERE category_id = ?').run(categoryId);
}
