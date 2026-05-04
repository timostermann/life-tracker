import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getCategoryById,
	checkCategoryAccess,
	listFieldsForCategory,
	listItemsForCategory,
	listUpcomingChores,
	getFieldValuesAsRecord,
	listHabitEntries,
	getHabitStats
} from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';
import { parseRecurringConfig } from '$lib/utils/recurring';
import type { HabitEntry } from '$lib/server/db/queries/types';
import type { HabitStats } from '$lib/schemas/habits';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(302, '/login');
	}

	const categoryId = Number(params.id);
	if (isNaN(categoryId)) {
		throw error(400, 'Invalid category ID');
	}

	const sql = getDb();

	const category = await getCategoryById(categoryId, sql);
	if (!category) {
		throw error(404, 'Category not found');
	}

	const canView = await checkCategoryAccess(user.id, categoryId, 'view', sql);
	if (!canView) {
		throw error(403, 'You do not have permission to view this category');
	}

	const [canEdit, fields, allItems, allArchivedItems] = await Promise.all([
		checkCategoryAccess(user.id, categoryId, 'edit', sql),
		listFieldsForCategory(categoryId, sql),
		listItemsForCategory(categoryId, { include_archived: false }, sql),
		listItemsForCategory(categoryId, { include_archived: true }, sql)
	]);

	const archivedItems = allArchivedItems.filter((item) => item.is_archived);

	const enrichedItems = await Promise.all(
		allItems.map(async (item) => ({
			...item,
			values: await getFieldValuesAsRecord(item.id, sql),
			recurring_config: parseRecurringConfig(item.recurring_config)
		}))
	);

	const enrichedArchivedItems = await Promise.all(
		archivedItems.map(async (item) => ({
			...item,
			values: await getFieldValuesAsRecord(item.id, sql),
			recurring_config: parseRecurringConfig(item.recurring_config)
		}))
	);

	// Load upcoming chores for schedule view if this is a chore category
	let upcomingChores: typeof enrichedItems = [];
	if (category.template_type === 'chore') {
		const upcoming = await listUpcomingChores(categoryId, 30, sql);
		upcomingChores = await Promise.all(
			upcoming.map(async (item) => ({
				...item,
				values: await getFieldValuesAsRecord(item.id, sql),
				recurring_config: parseRecurringConfig(item.recurring_config)
			}))
		);
	}

	// Load habit entries and stats if this is a habit category
	const habitEntries: Record<number, { entries: HabitEntry[]; stats: HabitStats }> = {};
	if (category.template_type === 'habit') {
		const oneYearAgo = new Date();
		oneYearAgo.setDate(oneYearAgo.getDate() - 365);
		const fromDate = oneYearAgo.toISOString().split('T')[0];

		await Promise.all(
			enrichedItems.map(async (item) => {
				const [entries, stats] = await Promise.all([
					listHabitEntries(item.id, { from_date: fromDate, limit: 365 }, sql),
					getHabitStats(item.id, sql)
				]);
				habitEntries[item.id] = { entries, stats };
			})
		);
	}

	return {
		category,
		fields,
		items: enrichedItems,
		archivedItems: enrichedArchivedItems,
		upcomingChores,
		habitEntries,
		canEdit,
		currentUserId: user.id
	};
};
