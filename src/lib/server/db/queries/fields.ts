import { getDb } from '../../db';
import type { CreateFieldInput } from './types';
import type { Db } from './utils';

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
