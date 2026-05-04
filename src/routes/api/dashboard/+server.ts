import { json, type RequestHandler } from '@sveltejs/kit';
import { getRecentCategoriesWithCounts } from '$lib/server/db/queries/categories';
import {
	getItemsAssignedToUser,
	getItemsDueSoon,
	getHabitsNotLoggedToday
} from '$lib/server/db/queries/items';
import { getFieldValuesForItem } from '$lib/server/db/queries/fieldValues';
import { getHabitStats } from '$lib/server/db/queries/habits';
import type { Item, Priority } from '$lib/server/db/queries/types';
import { getDb } from '$lib/server/db';
import { DASHBOARD_MAX_CATEGORIES, DASHBOARD_DUE_SOON_DAYS } from '$lib/utils/dashboard';

type ItemWithValues = Item & {
	values: Record<string, string>;
};

type HabitWithStreak = ItemWithValues & {
	current_streak: number;
};

async function enrichItemWithValues(item: Item): Promise<ItemWithValues> {
	const sql = getDb();
	const fieldValues = await getFieldValuesForItem(item.id, sql);
	const values: Record<string, string> = {};

	for (const fv of fieldValues) {
		values[fv.field_id.toString()] = fv.value ?? '';
	}

	return { ...item, values };
}

async function enrichHabitWithStreak(item: Item): Promise<HabitWithStreak> {
	const sql = getDb();
	const enriched = await enrichItemWithValues(item);
	const stats = await getHabitStats(item.id, sql);

	return {
		...enriched,
		current_streak: stats.current_streak
	};
}

function groupByPriority(items: ItemWithValues[]): {
	urgent: ItemWithValues[];
	high: ItemWithValues[];
	medium: ItemWithValues[];
	low: ItemWithValues[];
} {
	const grouped = {
		urgent: [] as ItemWithValues[],
		high: [] as ItemWithValues[],
		medium: [] as ItemWithValues[],
		low: [] as ItemWithValues[]
	};

	for (const item of items) {
		const priority = item.priority as Priority | null;
		if (!priority) {
			// Items without priority are treated as low priority
			grouped.low.push(item);
		} else if (priority in grouped) {
			grouped[priority].push(item);
		}
	}

	return grouped;
}

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Unauthorized', toast: 'error' }, { status: 401 });
		}

		const userId = locals.user.id;
		const sql = getDb();

		// Run all queries in parallel
		const [categories, assignedItems, dueSoonItems, habitsToday] = await Promise.all([
			getRecentCategoriesWithCounts(userId, DASHBOARD_MAX_CATEGORIES, sql),
			getItemsAssignedToUser(userId, sql),
			getItemsDueSoon(userId, DASHBOARD_DUE_SOON_DAYS, sql),
			getHabitsNotLoggedToday(userId, sql)
		]);

		// Enrich items with field values
		const enrichedAssignedItems = await Promise.all(
			assignedItems.map((item) => enrichItemWithValues(item))
		);
		const enrichedDueSoonItems = await Promise.all(
			dueSoonItems.map((item) => enrichItemWithValues(item))
		);
		const enrichedHabitsToday = await Promise.all(
			habitsToday.map((item) => enrichHabitWithStreak(item))
		);

		// Group assigned items by priority
		const assignedByPriority = groupByPriority(enrichedAssignedItems);

		return json({
			categories,
			assigned_to_me: assignedByPriority,
			due_soon: enrichedDueSoonItems,
			habits_today: enrichedHabitsToday
		});
	} catch (error) {
		console.error('Dashboard API error:', error);
		return json(
			{
				error: 'Failed to load dashboard data',
				toast: 'error'
			},
			{ status: 500 }
		);
	}
};
