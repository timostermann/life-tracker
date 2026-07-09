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
import type { Database } from 'better-sqlite3';
import { DASHBOARD_MAX_CATEGORIES, DASHBOARD_DUE_SOON_DAYS } from '$lib/utils/dashboard';

type ItemWithValues = Item & {
	values: Record<string, string>;
};

type HabitWithStreak = ItemWithValues & {
	current_streak: number;
};

function enrichItemWithValues(item: Item, db?: Database): ItemWithValues {
	const fieldValues = getFieldValuesForItem(item.id, db);
	const values: Record<string, string> = {};

	for (const fv of fieldValues) {
		values[fv.field_id.toString()] = fv.value ?? '';
	}

	return { ...item, values };
}

function enrichHabitWithStreak(item: Item, db?: Database): HabitWithStreak {
	const enriched = enrichItemWithValues(item, db);
	const stats = getHabitStats(item.id, db);

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
		const db = (locals as { db?: Database }).db; // For testing

		// Run all queries in parallel
		const [categories, assignedItems, dueSoonItems, habitsToday] = await Promise.all([
			getRecentCategoriesWithCounts(userId, DASHBOARD_MAX_CATEGORIES, db),
			getItemsAssignedToUser(userId, db),
			getItemsDueSoon(userId, DASHBOARD_DUE_SOON_DAYS, db),
			getHabitsNotLoggedToday(userId, db)
		]);

		// Enrich items with field values
		const enrichedAssignedItems = assignedItems.map((item) => enrichItemWithValues(item, db));
		const enrichedDueSoonItems = dueSoonItems.map((item) => enrichItemWithValues(item, db));
		const enrichedHabitsToday = habitsToday.map((item) => enrichHabitWithStreak(item, db));

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
