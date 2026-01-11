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

type SqlUpdate = {
	updates: string[];
	values: unknown[];
};

export function buildSqlUpdates(input: Record<string, unknown>): SqlUpdate {
	const updates: string[] = [];
	const values: unknown[] = [];

	for (const [key, value] of Object.entries(input)) {
		if (value !== undefined) {
			updates.push(`${key} = ?`);
			values.push(value);
		}
	}

	return { updates, values };
}

export function buildBooleanSqlUpdate(
	key: string,
	value: boolean | undefined
): { update: string; value: number } | null {
	if (value === undefined) return null;
	return {
		update: `${key} = ?`,
		value: value ? 1 : 0
	};
}
