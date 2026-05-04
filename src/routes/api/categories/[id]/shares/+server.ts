import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getCategoryById, listCategoryShares } from '$lib/server/db/queries';

export const GET: RequestHandler = async ({ params, locals }) => {
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

	const shares = await listCategoryShares(categoryId, sql);
	return json({ shares });
};
