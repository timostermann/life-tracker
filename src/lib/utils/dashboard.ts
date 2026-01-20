export const DASHBOARD_MAX_CATEGORIES = 6;
export const DASHBOARD_DUE_SOON_DAYS = 7;
export const DASHBOARD_MAX_ITEMS_PER_SECTION = 50;

export function getDaysUntilDue(deadline: string): string {
	const now = new Date();
	now.setHours(0, 0, 0, 0);

	const due = new Date(deadline);
	due.setHours(0, 0, 0, 0);

	const diffTime = due.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
