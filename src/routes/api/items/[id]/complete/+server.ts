import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getItemById,
	checkCategoryAccess,
	completeItem,
	getFieldValuesAsRecord
} from '$lib/server/db/queries';
import { getDb } from '$lib/server/db';
import type { Db } from '$lib/server/db/queries/utils';
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

	const db = (locals as { db?: Db }).db ?? getDb();

	const item = getItemById(itemId, db);
	if (!item) {
		return json({ error: 'Item not found' }, { status: 404 });
	}

	const canEdit = checkCategoryAccess(user.id, item.category_id, 'edit', db);
	if (!canEdit) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const { completed, nextOccurrence } = completeItem(itemId, db);

	const enrichedCompleted = {
		...completed,
		values: getFieldValuesAsRecord(completed.id, db),
		recurring_config: parseRecurringConfig(completed.recurring_config)
	};

	const enrichedNext = nextOccurrence
		? {
				...nextOccurrence,
				values: getFieldValuesAsRecord(nextOccurrence.id, db),
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
