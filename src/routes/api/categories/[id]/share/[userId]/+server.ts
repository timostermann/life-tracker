import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getCategoryById, revokeCategoryShare, getUserById } from '$lib/server/db/queries';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const categoryId = Number(params.id);
	if (Number.isNaN(categoryId)) {
		return json({ error: 'Invalid category ID' }, { status: 400 });
	}

	const sharedWithUserId = Number(params.userId);
	if (Number.isNaN(sharedWithUserId)) {
		return json({ error: 'Invalid user ID' }, { status: 400 });
	}

	const sql = getDb();
	const category = await getCategoryById(categoryId, sql);
	if (!category || category.user_id !== user.id) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	await revokeCategoryShare(categoryId, sharedWithUserId, sql);
	const targetUser = await getUserById(sharedWithUserId, sql);

	return json({
		toast: 'success',
		message: targetUser ? `Access revoked for ${targetUser.username}` : 'Access revoked'
	});
};
