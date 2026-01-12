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
	createField
} from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';
import type { Db } from '$lib/server/db/queries/utils';

function updateCategoryFields(categoryId: number, fields: CategoryFieldInput[], db: Db) {
	deleteFieldsForCategory(categoryId, db);

	if (fields.length === 0) return;

	for (const [index, field] of fields.entries()) {
		createField(
			{
				category_id: categoryId,
				name: field.name,
				field_type: field.field_type,
				options: field.options,
				field_order: field.field_order ?? index
			},
			db
		);
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

	const db = (locals as { db?: Db }).db ?? getDb();

	const category = getCategoryById(categoryId, db);
	if (!category) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	const canView = checkCategoryAccess(user.id, categoryId, 'view', db);
	if (!canView) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const fields = listFieldsForCategory(categoryId, db);

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

	const db = (locals as { db?: Db }).db ?? getDb();
	const category = getCategoryById(categoryId, db);
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

	const updateCategoryWithFields = db.transaction(() => {
		const updatedCategory = updateCategory(categoryId, categoryData, db);

		if (fields !== undefined) {
			updateCategoryFields(categoryId, fields, db);
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

	const db = (locals as { db?: Db }).db ?? getDb();
	const category = getCategoryById(categoryId, db);
	if (!category || category.user_id !== user.id) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

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
