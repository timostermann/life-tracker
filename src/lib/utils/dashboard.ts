export const DASHBOARD_MAX_CATEGORIES = 6;
export const DASHBOARD_DUE_SOON_DAYS = 7;
export const DASHBOARD_MAX_ITEMS_PER_SECTION = 50;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Difference in calendar days (local) between two dates; DST-safe. */
function localCalendarDayDiff(from: Date, to: Date): number {
	const fromUTC = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
	const toUTC = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
	return Math.round((toUTC - fromUTC) / MS_PER_DAY);
}

export function getDaysUntilDue(deadline: string): string {
	const now = new Date();
	const due = new Date(deadline);

	const diffDays = localCalendarDayDiff(now, due);

	if (diffDays === 0) return 'Due today';
	if (diffDays === 1) return 'Due tomorrow';
	if (diffDays < 0) {
		const absDays = Math.abs(diffDays);
		return `Overdue by ${absDays} day${absDays === 1 ? '' : 's'}`;
	}
	return `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
}

export function getOrderedFieldValues(values: Record<string, string>): string[] {
	return Object.keys(values)
		.sort((a, b) => Number(a) - Number(b))
		.map((key) => values[key]);
}

export function getItemTitle(values: Record<string, string>): string {
	const orderedValues = getOrderedFieldValues(values);
	return orderedValues[0] || 'Untitled';
}

export function getItemDescription(values: Record<string, string>): string | undefined {
	const orderedValues = getOrderedFieldValues(values);
	return orderedValues[1] || undefined;
}
