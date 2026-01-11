import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseRow, parseOptionalRow, buildSqlUpdates, buildBooleanSqlUpdate } from './utils';

describe('queries/utils', () => {
	describe('parseRow', () => {
		it('parses valid row data', () => {
			const schema = z.object({ id: z.number(), name: z.string() });
			const row = { id: 1, name: 'Test' };

			const result = parseRow(schema, row);

			expect(result).toEqual({ id: 1, name: 'Test' });
		});

		it('throws on invalid data', () => {
			const schema = z.object({ id: z.number(), name: z.string() });
			const row = { id: 'invalid', name: 'Test' };

			expect(() => parseRow(schema, row)).toThrow();
		});
	});

	describe('parseOptionalRow', () => {
		it('parses valid row data', () => {
			const schema = z.object({ id: z.number(), name: z.string() });
			const row = { id: 1, name: 'Test' };

			const result = parseOptionalRow(schema, row);

			expect(result).toEqual({ id: 1, name: 'Test' });
		});

		it('returns undefined for null/undefined row', () => {
			const schema = z.object({ id: z.number(), name: z.string() });

			expect(parseOptionalRow(schema, null)).toBeUndefined();
			expect(parseOptionalRow(schema, undefined)).toBeUndefined();
		});

		it('throws on invalid data', () => {
			const schema = z.object({ id: z.number(), name: z.string() });
			const row = { id: 'invalid', name: 'Test' };

			expect(() => parseOptionalRow(schema, row)).toThrow();
		});
	});

	describe('buildSqlUpdates', () => {
		it('builds updates for defined values', () => {
			const result = buildSqlUpdates({
				name: 'Test',
				icon: '📋',
				color: 'blue'
			});

			expect(result.updates).toEqual(['name = ?', 'icon = ?', 'color = ?']);
			expect(result.values).toEqual(['Test', '📋', 'blue']);
		});

		it('skips undefined values', () => {
			const result = buildSqlUpdates({
				name: 'Test',
				icon: undefined,
				color: 'blue'
			});

			expect(result.updates).toEqual(['name = ?', 'color = ?']);
			expect(result.values).toEqual(['Test', 'blue']);
		});

		it('includes null values', () => {
			const result = buildSqlUpdates({
				name: 'Test',
				icon: null,
				color: 'blue'
			});

			expect(result.updates).toEqual(['name = ?', 'icon = ?', 'color = ?']);
			expect(result.values).toEqual(['Test', null, 'blue']);
		});

		it('handles empty object', () => {
			const result = buildSqlUpdates({});

			expect(result.updates).toEqual([]);
			expect(result.values).toEqual([]);
		});

		it('handles all undefined values', () => {
			const result = buildSqlUpdates({
				name: undefined,
				icon: undefined,
				color: undefined
			});

			expect(result.updates).toEqual([]);
			expect(result.values).toEqual([]);
		});

		it('handles numeric values', () => {
			const result = buildSqlUpdates({
				count: 42,
				order: 0
			});

			expect(result.updates).toEqual(['count = ?', 'order = ?']);
			expect(result.values).toEqual([42, 0]);
		});

		it('handles boolean values', () => {
			const result = buildSqlUpdates({
				enabled: true,
				active: false
			});

			expect(result.updates).toEqual(['enabled = ?', 'active = ?']);
			expect(result.values).toEqual([true, false]);
		});
	});

	describe('buildBooleanSqlUpdate', () => {
		it('returns update for true value', () => {
			const result = buildBooleanSqlUpdate('is_active', true);

			expect(result).toEqual({
				update: 'is_active = ?',
				value: 1
			});
		});

		it('returns update for false value', () => {
			const result = buildBooleanSqlUpdate('is_active', false);

			expect(result).toEqual({
				update: 'is_active = ?',
				value: 0
			});
		});

		it('returns null for undefined value', () => {
			const result = buildBooleanSqlUpdate('is_active', undefined);

			expect(result).toBeNull();
		});
	});
});
