import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listCategoriesForUser, listTemplates } from '$lib/server/db/queries';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(303, '/login');
	}

	const { owned, shared } = listCategoriesForUser(user.id);
	const templates = listTemplates();

	return {
		categories: {
			owned,
			shared
		},
		templates
	};
};
