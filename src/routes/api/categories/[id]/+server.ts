import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateCategorySchema } from '$lib/schemas/categories';
import {
	getCategoryById,
	updateCategory,
	deleteCategory,
	listFieldsForCategory,
	deleteFieldsForCategory,
	createField,
	type CreateFieldInput
} from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const categoryId = Number(params.id);
	if (isNaN(categoryId)) {
		return json({ error: 'Invalid category ID' }, { status: 400 });
	}

	const category = getCategoryById(categoryId);
	if (!category) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	if (category.user_id !== user.id) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	const fields = listFieldsForCategory(categoryId);

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

	const category = getCategoryById(categoryId);
	if (!category) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	if (category.user_id !== user.id) {
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

	const db = getDb();
	const updateCategoryWithFields = db.transaction(() => {
		const updatedCategory = updateCategory(categoryId, categoryData, db);

		if (fields !== undefined) {
			deleteFieldsForCategory(categoryId, db);

			if (fields.length > 0) {
				const fieldInputs: CreateFieldInput[] = fields.map((field, index) => ({
					category_id: categoryId,
					name: field.name,
					field_type: field.field_type,
					options: field.options,
					field_order: field.field_order ?? index
				}));

				for (const fieldInput of fieldInputs) {
					createField(fieldInput, db);
				}
			}
		}

		return updatedCategory;
	});

	const updatedCategory = updateCategoryWithFields();

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

	const category = getCategoryById(categoryId);
	if (!category) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	if (category.user_id !== user.id) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	const db = getDb();
	const deleteCategoryWithFields = db.transaction(() => {
		deleteFieldsForCategory(categoryId, db);
		deleteCategory(categoryId, db);
	});

	deleteCategoryWithFields();

	return json({
		toast: 'success',
		message: 'Category deleted successfully'
	});
};
