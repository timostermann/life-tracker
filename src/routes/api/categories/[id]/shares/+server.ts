import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getCategoryById, listCategoryShares } from '$lib/server/db/queries';
import type { Db } from '$lib/server/db/queries/utils';

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const categoryId = Number(params.id);
	if (Number.isNaN(categoryId)) {
		return json({ error: 'Invalid category ID' }, { status: 400 });
	}

	const db = (locals as { db?: Db }).db ?? getDb();
	const category = getCategoryById(categoryId, db);
	if (!category || category.user_id !== user.id) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	const shares = listCategoryShares(categoryId, db);
	return json({ shares });
};
