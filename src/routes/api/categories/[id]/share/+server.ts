import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { shareCategorySchema } from '$lib/schemas/categories';
import { getDb } from '$lib/server/db';
import {
	getCategoryById,
	getUserById,
	shareCategory,
	updateCategory
} from '$lib/server/db/queries';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const categoryId = Number(params.id);
	if (Number.isNaN(categoryId)) {
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

	const parsed = shareCategorySchema.safeParse(body);
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

	if (parsed.data.user_id === user.id) {
		return json(
			{
				error: 'Invalid input',
				toast: 'error',
				message: "You can't share a category with yourself"
			},
			{ status: 400 }
		);
	}

	const targetUser = await getUserById(parsed.data.user_id, sql);
	if (!targetUser) {
		return json(
			{
				error: 'Invalid input',
				toast: 'error',
				message: 'User not found'
			},
			{ status: 400 }
		);
	}

	try {
		await sql.begin(async (tx) => {
			await shareCategory(categoryId, parsed.data.user_id, parsed.data.permission, tx);
			await updateCategory(categoryId, { is_private: false }, tx);
		});
	} catch (err) {
		const code = (err as { code?: unknown } | null)?.code;
		if (code === '23505') {
			return json(
				{
					error: 'Already shared',
					toast: 'error',
					message: 'Category is already shared with this user'
				},
				{ status: 400 }
			);
		}
		throw err;
	}

	return json({
		toast: 'success',
		message: `Category shared with ${targetUser.username}`
	});
};
