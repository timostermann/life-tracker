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

	const sql = getDb();
	const categories = await listCategoriesForUser(user.id, sql);
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

	const sql = getDb();
	const category = await sql.begin(async (tx) => {
		const category = await createCategory(
			{
				user_id: user.id,
				...categoryData
			},
			tx
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
				await createField(fieldInput, tx);
			}
		}

		return category;
	});

	return json(
		{
			category,
			toast: 'success',
			message: 'Category created successfully'
		},
		{ status: 201 }
	);
};
