import type { RecurringConfig } from '$lib/schemas/items';

export function parseRecurringConfig(jsonString: string | null): RecurringConfig | null {
	if (!jsonString) return null;

	try {
		const parsed = JSON.parse(jsonString);
		if (
			typeof parsed === 'object' &&
			parsed !== null &&
			'frequency' in parsed &&
			'interval' in parsed &&
			['daily', 'weekly', 'monthly'].includes(parsed.frequency) &&
			typeof parsed.interval === 'number' &&
			parsed.interval > 0
		) {
			return parsed as RecurringConfig;
		}
		return null;
	} catch {
		return null;
	}
}

export function stringifyRecurringConfig(config: RecurringConfig | null): string | null {
	if (!config) return null;
	return JSON.stringify(config);
}

export function calculateNextDate(config: RecurringConfig, from: Date = new Date()): Date {
	const { frequency, interval } = config;
	const next = new Date(from);

	switch (frequency) {
		case 'daily':
			next.setDate(next.getDate() + interval);
			break;
		case 'weekly':
			next.setDate(next.getDate() + interval * 7);
			break;
		case 'monthly':
			next.setMonth(next.getMonth() + interval);
			break;
	}

	return next;
}

export function formatRecurringConfig(config: RecurringConfig): string {
	const { frequency, interval } = config;

	if (interval === 1) {
		return `${frequency.charAt(0).toUpperCase() + frequency.slice(1)}`;
	}

	return `Every ${interval} ${frequency === 'daily' ? 'days' : frequency === 'weekly' ? 'weeks' : 'months'}`;
}
