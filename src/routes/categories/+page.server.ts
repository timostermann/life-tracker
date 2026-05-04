import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listCategoriesForUser, listTemplates } from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(303, '/login');
	}

	const sql = getDb();
	const [{ owned, shared }, templates] = await Promise.all([
		listCategoriesForUser(user.id, sql),
		listTemplates(undefined, sql)
	]);

	return {
		categories: {
			owned,
			shared
		},
		templates
	};
};
