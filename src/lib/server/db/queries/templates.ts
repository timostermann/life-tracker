import { getDb } from '../../db';
import { dbSchemas, type Template } from './types';
import type { Db } from './utils';
import { parseOptionalRow, parseRow } from './utils';

export function listTemplates(db: Db = getDb()): Template[] {
	const rows = db.prepare('SELECT * FROM templates ORDER BY id ASC').all();
	return rows.map((r) => parseRow(dbSchemas.templateSchema, r));
}

export function getTemplateById(id: number, db: Db = getDb()): Template | undefined {
	const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
	return parseOptionalRow(dbSchemas.templateSchema, row);
}
