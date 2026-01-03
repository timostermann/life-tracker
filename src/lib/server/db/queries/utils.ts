import type { Database as BetterSqlite3Database } from 'better-sqlite3';
import type { z } from 'zod';

export type Db = BetterSqlite3Database;

export function parseRow<T>(schema: z.ZodType<T>, row: unknown): T {
	return schema.parse(row);
}

export function parseOptionalRow<T>(schema: z.ZodType<T>, row: unknown): T | undefined {
	if (!row) return undefined;
	return schema.parse(row);
}
