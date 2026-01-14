import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getCategoryById,
	checkCategoryAccess,
	listFieldsForCategory,
	listItemsForCategory,
	listUpcomingChores,
	getFieldValuesAsRecord
} from '$lib/server/db/queries';
import { parseRecurringConfig } from '$lib/utils/recurring';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(302, '/login');
	}

	const categoryId = Number(params.id);
	if (isNaN(categoryId)) {
		throw error(400, 'Invalid category ID');
	}

	const category = getCategoryById(categoryId);
	if (!category) {
		throw error(404, 'Category not found');
	}

	const canView = checkCategoryAccess(user.id, categoryId, 'view');
	if (!canView) {
		throw error(403, 'You do not have permission to view this category');
	}

	const canEdit = checkCategoryAccess(user.id, categoryId, 'edit');
	const fields = listFieldsForCategory(categoryId);
	const items = listItemsForCategory(categoryId, { include_archived: false });
	const archivedItems = listItemsForCategory(categoryId, { include_archived: true }).filter(
		(item) => item.is_archived
	);

	const enrichedItems = items.map((item) => ({
		...item,
		values: getFieldValuesAsRecord(item.id),
		recurring_config: parseRecurringConfig(item.recurring_config)
	}));

	const enrichedArchivedItems = archivedItems.map((item) => ({
		...item,
		values: getFieldValuesAsRecord(item.id),
		recurring_config: parseRecurringConfig(item.recurring_config)
	}));

	// Load upcoming chores for schedule view if this is a chore category
	let upcomingChores: typeof enrichedItems = [];
	if (category.template_type === 'chore') {
		const upcoming = listUpcomingChores(categoryId, 30);
		upcomingChores = upcoming.map((item) => ({
			...item,
			values: getFieldValuesAsRecord(item.id),
			recurring_config: parseRecurringConfig(item.recurring_config)
		}));
	}

	return {
		category,
		fields,
		items: enrichedItems,
		archivedItems: enrichedArchivedItems,
		upcomingChores,
		canEdit
	};
};
