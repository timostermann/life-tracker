import { getDb } from '../../db';
import { dbSchemas, type Template, type TemplateType } from './types';
import type { Db } from './utils';
import { parseOptionalRow, parseRow } from './utils';

export function listTemplates(type?: TemplateType, db: Db = getDb()): Template[] {
	const sql = type
		? 'SELECT * FROM templates WHERE template_type = ? ORDER BY id ASC'
		: 'SELECT * FROM templates ORDER BY id ASC';
	const rows = type ? db.prepare(sql).all(type) : db.prepare(sql).all();
	return rows.map((r) => parseRow(dbSchemas.templateSchema, r));
}

export function getTemplateById(id: number, db: Db = getDb()): Template | undefined {
	const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
	return parseOptionalRow(dbSchemas.templateSchema, row);
}
