import { getDb } from '../../db';
import { dbSchemas, type CreateFieldInput, type UpdateFieldInput, type Field } from './types';
import type { Db } from './utils';
import { parseRow } from './utils';

export async function listFieldsForCategory(
	categoryId: number,
	sql: Db = getDb()
): Promise<Field[]> {
	const rows =
		await sql`SELECT * FROM fields WHERE category_id = ${categoryId} ORDER BY field_order ASC`;
	return rows.map((r) => parseRow(dbSchemas.fieldSchema, r));
}

export async function createField(input: CreateFieldInput, sql: Db = getDb()): Promise<Field> {
	const [row] = await sql`
		INSERT INTO fields (category_id, name, field_type, options, field_order)
		VALUES (${input.category_id}, ${input.name}, ${input.field_type}, ${input.options ?? null}, ${input.field_order})
		RETURNING *
	`;
	return parseRow(dbSchemas.fieldSchema, row);
}

export async function createFields(input: CreateFieldInput[], sql: Db = getDb()): Promise<void> {
	if (!input.length) return;
	const rows = input.map((f) => ({
		category_id: f.category_id,
		name: f.name,
		field_type: f.field_type,
		options: f.options ?? null,
		field_order: f.field_order
	}));
	await sql`INSERT INTO fields ${sql(rows)}`;
}

export async function updateField(
	fieldId: number,
	input: UpdateFieldInput,
	sql: Db = getDb()
): Promise<Field> {
	const updates: Record<string, unknown> = {};
	if (input.name !== undefined) updates.name = input.name;
	if (input.field_type !== undefined) updates.field_type = input.field_type;
	if (input.options !== undefined) updates.options = input.options;
	if (input.field_order !== undefined) updates.field_order = input.field_order;

	if (Object.keys(updates).length > 0) {
		await sql`UPDATE fields SET ${sql(updates)} WHERE id = ${fieldId}`;
	}

	const [row] = await sql`SELECT * FROM fields WHERE id = ${fieldId}`;
	return parseRow(dbSchemas.fieldSchema, row);
}

export async function deleteField(fieldId: number, sql: Db = getDb()): Promise<void> {
	await sql`DELETE FROM fields WHERE id = ${fieldId}`;
}

export async function deleteFieldsForCategory(
	categoryId: number,
	sql: Db = getDb()
): Promise<void> {
	await sql`DELETE FROM fields WHERE category_id = ${categoryId}`;
}
