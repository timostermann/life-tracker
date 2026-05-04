import { getDb } from '../../db';
import { dbSchemas, type Template, type TemplateType } from './types';
import type { Db } from './utils';
import { parseOptionalRow, parseRow } from './utils';

export async function listTemplates(type?: TemplateType, sql: Db = getDb()): Promise<Template[]> {
	const rows = type
		? await sql`SELECT * FROM templates WHERE template_type = ${type} ORDER BY id ASC`
		: await sql`SELECT * FROM templates ORDER BY id ASC`;
	return rows.map((r) => parseRow(dbSchemas.templateSchema, r));
}

export async function getTemplateById(
	id: number,
	sql: Db = getDb()
): Promise<Template | undefined> {
	const [row] = await sql`SELECT * FROM templates WHERE id = ${id}`;
	return parseOptionalRow(dbSchemas.templateSchema, row);
}
