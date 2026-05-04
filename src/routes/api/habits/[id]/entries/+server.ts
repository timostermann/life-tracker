import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { habitEntrySchema, listHabitEntriesQuerySchema } from '$lib/schemas/habits';
import {
	getItemById,
	checkCategoryAccess,
	listHabitEntries,
	upsertHabitEntry,
	getHabitStats
} from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const itemId = Number(params.id);
	if (isNaN(itemId)) {
		return json({ error: 'Invalid habit ID' }, { status: 400 });
	}

	const sql = getDb();

	const item = await getItemById(itemId, sql);
	if (!item) {
		return json({ error: 'Habit not found' }, { status: 404 });
	}

	const canView = await checkCategoryAccess(user.id, item.category_id, 'view', sql);
	if (!canView) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const queryParams = Object.fromEntries(url.searchParams.entries());
	const parsed = listHabitEntriesQuerySchema.safeParse(queryParams);

	if (!parsed.success) {
		return json(
			{
				error: 'Invalid query parameters',
				issues: parsed.error.flatten(),
				toast: 'error'
			},
			{ status: 400 }
		);
	}

	const today = new Date();
	const oneYearAgo = new Date(today);
	oneYearAgo.setDate(oneYearAgo.getDate() - 365);

	const fromDate = parsed.data.from_date ?? oneYearAgo.toISOString().split('T')[0];
	const toDate = parsed.data.to_date ?? today.toISOString().split('T')[0];

	const entries = await listHabitEntries(
		itemId,
		{ from_date: fromDate, to_date: toDate, limit: 365 },
		sql
	);
	const stats = await getHabitStats(itemId, sql);

	return json({ entries, stats });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const itemId = Number(params.id);
	if (isNaN(itemId)) {
		return json({ error: 'Invalid habit ID' }, { status: 400 });
	}

	const sql = getDb();

	const item = await getItemById(itemId, sql);
	if (!item) {
		return json({ error: 'Habit not found' }, { status: 404 });
	}

	const canEdit = await checkCategoryAccess(user.id, item.category_id, 'edit', sql);
	if (!canEdit) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = habitEntrySchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{
				error: 'Invalid input',
				issues: parsed.error.flatten(),
				toast: 'error',
				message: 'Please check your input and try again'
			},
			{ status: 400 }
		);
	}

	const entry = await upsertHabitEntry(
		{
			item_id: itemId,
			logged_date: parsed.data.logged_date,
			status: parsed.data.status,
			notes: parsed.data.notes ?? null
		},
		sql
	);

	const updatedStats = await getHabitStats(itemId, sql);

	return json({
		entry,
		updated_stats: updatedStats,
		toast: 'success',
		message: 'Entry logged successfully'
	});
};
