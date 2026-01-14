import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import {
	getItemById,
	checkCategoryAccess,
	getHabitEntry,
	upsertHabitEntry,
	deleteHabitEntry,
	getHabitStats
} from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';
import type { Db } from '$lib/server/db/queries/utils';
import { habitEntryStatusSchema } from '$lib/schemas/db';

const updateEntrySchema = z.object({
	status: habitEntryStatusSchema,
	notes: z.string().max(500).optional()
});

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const itemId = Number(params.id);
	const loggedDate = params.date;

	if (isNaN(itemId) || !loggedDate || !/^\d{4}-\d{2}-\d{2}$/.test(loggedDate)) {
		return json({ error: 'Invalid habit ID or date' }, { status: 400 });
	}

	const db = (locals as { db?: Db }).db ?? getDb();

	const item = getItemById(itemId, db);
	if (!item) {
		return json({ error: 'Habit not found' }, { status: 404 });
	}

	const canEdit = checkCategoryAccess(user.id, item.category_id, 'edit', db);
	if (!canEdit) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const existingEntry = getHabitEntry(itemId, loggedDate, db);
	if (!existingEntry) {
		return json({ error: 'Entry not found' }, { status: 404 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const parsed = updateEntrySchema.safeParse(body);
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

	const entry = upsertHabitEntry(
		{
			item_id: itemId,
			logged_date: loggedDate,
			status: parsed.data.status,
			notes:
				parsed.data.notes !== undefined ? parsed.data.notes || null : (existingEntry.notes ?? null)
		},
		db
	);

	const updatedStats = getHabitStats(itemId, db);

	return json({
		entry,
		updated_stats: updatedStats,
		toast: 'success',
		message: 'Entry updated successfully'
	});
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const itemId = Number(params.id);
	const loggedDate = params.date;

	if (isNaN(itemId) || !loggedDate || !/^\d{4}-\d{2}-\d{2}$/.test(loggedDate)) {
		return json({ error: 'Invalid habit ID or date' }, { status: 400 });
	}

	const db = (locals as { db?: Db }).db ?? getDb();

	const item = getItemById(itemId, db);
	if (!item) {
		return json({ error: 'Habit not found' }, { status: 404 });
	}

	const canEdit = checkCategoryAccess(user.id, item.category_id, 'edit', db);
	if (!canEdit) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const existingEntry = getHabitEntry(itemId, loggedDate, db);
	if (!existingEntry) {
		return json({ error: 'Entry not found' }, { status: 404 });
	}

	deleteHabitEntry(itemId, loggedDate, db);

	const updatedStats = getHabitStats(itemId, db);

	return json({
		success: true,
		updated_stats: updatedStats,
		toast: 'success',
		message: 'Entry deleted successfully'
	});
};
