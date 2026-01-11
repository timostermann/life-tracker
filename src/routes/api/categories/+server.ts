import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCategorySchema } from '$lib/schemas/categories';
import {
	createCategory,
	listCategoriesForUser,
	createField,
	type CreateFieldInput
} from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const categories = listCategoriesForUser(user.id);
	return json({ categories });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = createCategorySchema.safeParse(body);
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
	const createCategoryWithFields = db.transaction(() => {
		const category = createCategory(
			{
				user_id: user.id,
				...categoryData
			},
			db
		);

		if (fields && fields.length > 0) {
			const fieldInputs: CreateFieldInput[] = fields.map((field, index) => ({
				category_id: category.id,
				name: field.name,
				field_type: field.field_type,
				options: field.options,
				field_order: field.field_order ?? index
			}));

			for (const fieldInput of fieldInputs) {
				createField(fieldInput, db);
			}
		}

		return category;
	});

	const category = createCategoryWithFields();

	return json(
		{
			category,
			toast: 'success',
			message: 'Category created successfully'
		},
		{ status: 201 }
	);
};
