import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getItemById,
	checkCategoryAccess,
	completeItem,
	getFieldValuesAsRecord
} from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';
import { parseRecurringConfig } from '$lib/utils/recurring';

export const POST: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const itemId = Number(params.id);
	if (isNaN(itemId)) {
		return json({ error: 'Invalid item ID' }, { status: 400 });
	}

	const sql = getDb();

	const item = await getItemById(itemId, sql);
	if (!item) {
		return json({ error: 'Item not found' }, { status: 404 });
	}

	const canEdit = await checkCategoryAccess(user.id, item.category_id, 'edit', sql);
	if (!canEdit) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const { completed, nextOccurrence } = await completeItem(itemId, sql);

	const enrichedCompleted = {
		...completed,
		values: await getFieldValuesAsRecord(completed.id, sql),
		recurring_config: parseRecurringConfig(completed.recurring_config)
	};

	const enrichedNext = nextOccurrence
		? {
				...nextOccurrence,
				values: await getFieldValuesAsRecord(nextOccurrence.id, sql),
				recurring_config: parseRecurringConfig(nextOccurrence.recurring_config)
			}
		: null;

	return json({
		completed_item: enrichedCompleted,
		next_item: enrichedNext,
		toast: 'success',
		message: nextOccurrence ? 'Item completed. Next occurrence created.' : 'Item completed.'
	});
};
