import type { HabitEntry } from '$lib/schemas/db';

export function calculateStreak(entries: HabitEntry[]): number {
	const doneEntries = entries
		.filter((e) => e.status === 'done')
		.map((e) => {
			const date = new Date(e.logged_date);
			date.setHours(0, 0, 0, 0);
			return { ...e, date };
		})
		.sort((a, b) => b.date.getTime() - a.date.getTime());

	if (doneEntries.length === 0) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	let streak = 0;
	let expectedDate = today;

	for (const entry of doneEntries) {
		const daysDiff = Math.floor(
			(expectedDate.getTime() - entry.date.getTime()) / (1000 * 60 * 60 * 24)
		);
		if (daysDiff > 1) {
			break;
		}
		// Handle today (daysDiff === 0) or first entry that's yesterday (streak === 0 && daysDiff <= 1)
		// This allows starting a streak from yesterday if today hasn't been logged yet
		if (daysDiff === 0 || (streak === 0 && daysDiff <= 1)) {
			streak++;
			expectedDate = new Date(entry.date);
			expectedDate.setDate(expectedDate.getDate() - 1);
		}
	}

	return streak;
}

export function calculateLongestStreak(entries: HabitEntry[]): number {
	const doneEntries = entries
		.filter((e) => e.status === 'done')
		.sort((a, b) => new Date(a.logged_date).getTime() - new Date(b.logged_date).getTime());

	if (doneEntries.length === 0) return 0;

	let longestStreak = 1;
	let currentStreak = 1;

	for (let i = 1; i < doneEntries.length; i++) {
		const prevDate = new Date(doneEntries[i - 1].logged_date);
		const currDate = new Date(doneEntries[i].logged_date);
		prevDate.setHours(0, 0, 0, 0);
		currDate.setHours(0, 0, 0, 0);

		const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

		if (daysDiff === 1) {
			currentStreak++;
			longestStreak = Math.max(longestStreak, currentStreak);
		} else {
			currentStreak = 1;
		}
	}

	return longestStreak;
}

export function calculateFrequency(
	entries: HabitEntry[],
	days: number
): { done: number; total: number } {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);
	cutoff.setHours(0, 0, 0, 0);

	const recent = entries.filter((e) => {
		const entryDate = new Date(e.logged_date);
		entryDate.setHours(0, 0, 0, 0);
		return entryDate >= cutoff;
	});

	const done = recent.filter((e) => e.status === 'done').length;
	return { done, total: days };
}
