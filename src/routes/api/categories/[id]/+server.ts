import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateCategorySchema, type CategoryFieldInput } from '$lib/schemas/categories';
import {
	getCategoryById,
	checkCategoryAccess,
	updateCategory,
	deleteCategory,
	listFieldsForCategory,
	deleteFieldsForCategory,
	createField,
	updateField,
	deleteField
} from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';
import type { Db } from '$lib/server/db/queries/utils';

async function updateCategoryFields(categoryId: number, fields: CategoryFieldInput[], tx: Db) {
	// Get existing field IDs for this category
	const existingFields = await listFieldsForCategory(categoryId, tx);
	const existingFieldIds = new Set(existingFields.map((f) => f.id));
	const updatedFieldIds = new Set<number>();

	// Update or create fields
	for (const [index, field] of fields.entries()) {
		if (field.id && existingFieldIds.has(field.id)) {
			// Update existing field
			updatedFieldIds.add(field.id);
			await updateField(
				field.id,
				{
					name: field.name,
					field_type: field.field_type,
					options: field.options,
					field_order: field.field_order ?? index
				},
				tx
			);
		} else {
			// Create new field
			await createField(
				{
					category_id: categoryId,
					name: field.name,
					field_type: field.field_type,
					options: field.options,
					field_order: field.field_order ?? index
				},
				tx
			);
		}
	}

	// Delete fields that are no longer in the list
	for (const existingField of existingFields) {
		if (!updatedFieldIds.has(existingField.id)) {
			await deleteField(existingField.id, tx);
		}
	}
}

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const categoryId = Number(params.id);
	if (isNaN(categoryId)) {
		return json({ error: 'Invalid category ID' }, { status: 400 });
	}

	const sql = getDb();

	const category = await getCategoryById(categoryId, sql);
	if (!category) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	const canView = await checkCategoryAccess(user.id, categoryId, 'view', sql);
	if (!canView) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const fields = await listFieldsForCategory(categoryId, sql);

	return json({
		category: {
			...category,
			fields
		}
	});
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const categoryId = Number(params.id);
	if (isNaN(categoryId)) {
		return json({ error: 'Invalid category ID' }, { status: 400 });
	}

	const sql = getDb();
	const category = await getCategoryById(categoryId, sql);
	if (!category || category.user_id !== user.id) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = updateCategorySchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{
				error: 'Invalid input',
				issues: parsed.error.flatten(),
				toast: 'error',
				message: 'Please check your input and try again'
			},
			{ status: 400 }
		);
	}

	const { fields, ...categoryData } = parsed.data;

	const updatedCategory = await sql.begin(async (tx) => {
		const updated = await updateCategory(categoryId, categoryData, tx);

		if (fields !== undefined) {
			await updateCategoryFields(categoryId, fields, tx);
		}

		return updated;
	});

	return json({
		category: updatedCategory,
		toast: 'success',
		message: 'Category updated successfully'
	});
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const categoryId = Number(params.id);
	if (isNaN(categoryId)) {
		return json({ error: 'Invalid category ID' }, { status: 400 });
	}

	const sql = getDb();
	const category = await getCategoryById(categoryId, sql);
	if (!category || category.user_id !== user.id) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	await sql.begin(async (tx) => {
		await deleteFieldsForCategory(categoryId, tx);
		await deleteCategory(categoryId, tx);
	});

	return json({
		toast: 'success',
		message: 'Category deleted successfully'
	});
};
