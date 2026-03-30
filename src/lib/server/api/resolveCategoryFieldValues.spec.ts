import { describe, it, expect } from 'vitest';
import type { Field } from '$lib/schemas/db';
import { resolveCategoryFieldValues, FIELD_VALUES_KEY_HINT } from './resolveCategoryFieldValues';

function field(partial: Pick<Field, 'id' | 'field_order'> & Partial<Field>): Field {
	return {
		category_id: 1,
		name: 'F',
		field_type: 'text',
		options: null,
		created_at: '2026-01-01 00:00:00',
		...partial
	};
}

describe('resolveCategoryFieldValues', () => {
	it('resolves keys that match field id', () => {
		const fields = [field({ id: 42, field_order: 0 }), field({ id: 43, field_order: 1 })];
		const result = resolveCategoryFieldValues({ 42: 'a', 43: 'b' }, fields);
		expect(result).toEqual({ ok: true, resolved: { 42: 'a', 43: 'b' } });
	});

	it('resolves keys by field_order when id does not match and order is unique', () => {
		const fields = [field({ id: 100, field_order: 1 }), field({ id: 101, field_order: 2 })];
		const result = resolveCategoryFieldValues({ 1: 'Title', 2: 'Desc' }, fields);
		expect(result).toEqual({ ok: true, resolved: { 100: 'Title', 101: 'Desc' } });
	});

	it('prefers field id when key matches an existing id', () => {
		const fields = [field({ id: 1, field_order: 5 })];
		const result = resolveCategoryFieldValues({ 1: 'by id' }, fields);
		expect(result).toEqual({ ok: true, resolved: { 1: 'by id' } });
	});

	it('returns ambiguous_field_order when multiple fields share that order', () => {
		const fields = [
			field({ id: 10, field_order: 1, name: 'a' }),
			field({ id: 11, field_order: 1, name: 'b' })
		];
		const result = resolveCategoryFieldValues({ 1: 'x' }, fields);
		expect(result.ok).toBe(false);
		if (!result.ok && result.error.code === 'ambiguous_field_order') {
			expect(result.error.field_order).toBe(1);
			expect(result.error.message).toContain('field id');
		}
	});

	it('returns unknown_field when key does not match id or unique order', () => {
		const fields = [field({ id: 50, field_order: 3 })];
		const result = resolveCategoryFieldValues({ 1: 'nope' }, fields);
		expect(result.ok).toBe(false);
		if (!result.ok && result.error.code === 'unknown_field') {
			expect(result.error.keys).toEqual(['1']);
			expect(result.error.message).toContain(FIELD_VALUES_KEY_HINT);
		}
	});

	it('rejects non-numeric keys', () => {
		const fields = [field({ id: 1, field_order: 0 })];
		const result = resolveCategoryFieldValues({ Title: 'x' }, fields);
		expect(result.ok).toBe(false);
		if (!result.ok && result.error.code === 'unknown_field') {
			expect(result.error.keys).toEqual(['Title']);
		}
	});

	it('returns empty resolved for empty values', () => {
		const result = resolveCategoryFieldValues({}, [field({ id: 1, field_order: 0 })]);
		expect(result).toEqual({ ok: true, resolved: {} });
	});

	it('allows empty string values', () => {
		const fields = [field({ id: 7, field_order: 1 })];
		const result = resolveCategoryFieldValues({ 7: '' }, fields);
		expect(result).toEqual({ ok: true, resolved: { 7: '' } });
	});
});
