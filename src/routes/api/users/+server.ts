import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { listUsers, listUsersWithCategoryAccess } from '$lib/server/db/queries';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const sql = getDb();

	// If categoryId is provided, return only users with access to that category
	const categoryIdParam = url.searchParams.get('categoryId');
	if (categoryIdParam) {
		const categoryId = Number(categoryIdParam);
		if (isNaN(categoryId)) {
			return json({ error: 'Invalid categoryId' }, { status: 400 });
		}
		const users = await listUsersWithCategoryAccess(categoryId, sql);
		return json({ users });
	}

	const users = await listUsers(sql);
	return json({ users });
};
