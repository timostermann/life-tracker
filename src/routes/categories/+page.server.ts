import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listCategoriesForUser } from '$lib/server/db/queries';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(303, '/login');
	}

	const { owned, shared } = listCategoriesForUser(user.id);

	return {
		categories: {
			owned,
			shared
		}
	};
};
