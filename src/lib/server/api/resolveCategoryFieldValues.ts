import type { Field } from '$lib/schemas/db';

export const FIELD_VALUES_KEY_HINT =
	'Use each field’s database id as the key (see GET /api/categories/:id fields[].id), or use field_order when it is unique within the category.';

export type ResolveFieldValuesError =
	| { code: 'unknown_field'; keys: string[]; message: string }
	| { code: 'ambiguous_field_order'; field_order: number; message: string };

/**
 * Maps `values` from POST/PATCH item bodies to field_id keys expected by the DB.
 * Accepts keys that are either `fields.id` for this category, or `field_order` when exactly one field has that order.
 */
export function resolveCategoryFieldValues(
	values: Record<string, string>,
	categoryFields: Field[]
): { ok: true; resolved: Record<string, string> } | { ok: false; error: ResolveFieldValuesError } {
	const resolved: Record<string, string> = {};
	const unknownKeys: string[] = [];

	for (const [key, value] of Object.entries(values)) {
		const resolvedId = resolveOneKey(key, categoryFields);
		if (resolvedId === undefined) {
			unknownKeys.push(key);
			continue;
		}
		if (typeof resolvedId === 'object') {
			return { ok: false, error: resolvedId };
		}
		resolved[String(resolvedId)] = value;
	}

	if (unknownKeys.length > 0) {
		return {
			ok: false,
			error: {
				code: 'unknown_field',
				keys: unknownKeys,
				message: `Unknown field key(s): ${unknownKeys.join(', ')}. ${FIELD_VALUES_KEY_HINT}`
			}
		};
	}

	return { ok: true, resolved };
}

function resolveOneKey(
	key: string,
	categoryFields: Field[]
): number | undefined | ResolveFieldValuesError {
	if (!/^\d+$/.test(key)) {
		return undefined;
	}

	const n = Number(key);
	const byId = categoryFields.find((f) => f.id === n);
	if (byId) {
		return byId.id;
	}

	const byOrder = categoryFields.filter((f) => f.field_order === n);
	if (byOrder.length === 1) {
		return byOrder[0].id;
	}
	if (byOrder.length > 1) {
		return {
			code: 'ambiguous_field_order',
			field_order: n,
			message: `Multiple fields use field_order ${n} in this category; use field id as the key instead. ${FIELD_VALUES_KEY_HINT}`
		};
	}

	return undefined;
}
