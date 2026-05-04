import type { Sql, TransactionSql } from 'postgres';
import type { z } from 'zod';

// Accepts both the top-level Sql instance and a TransactionSql (tx) from sql.begin()
export type Db = Sql | TransactionSql;

export function parseRow<T>(schema: z.ZodType<T>, row: unknown): T {
	return schema.parse(row);
}

export function parseOptionalRow<T>(schema: z.ZodType<T>, row: unknown): T | undefined {
	if (!row) return undefined;
	return schema.parse(row);
}

export function buildSqlUpdates(input: Record<string, unknown>) {
	const updates: string[] = [];
	const values: unknown[] = [];

	for (const [key, value] of Object.entries(input)) {
		if (value === undefined) continue;
		updates.push(`${key} = ?`);
		values.push(value);
	}

	return { updates, values };
}

export function buildBooleanSqlUpdate(key: string, value: boolean | undefined) {
	if (value === undefined) return null;
	return {
		update: `${key} = ?`,
		value: value ? 1 : 0
	};
}
