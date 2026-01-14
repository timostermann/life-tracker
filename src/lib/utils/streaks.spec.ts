import { describe, it, expect } from 'vitest';
import { calculateStreak, calculateLongestStreak, calculateFrequency } from './streaks';
import type { HabitEntry } from '$lib/schemas/db';

function createEntry(date: string, status: 'done' | 'skipped' | 'failed'): HabitEntry {
	return {
		id: 1,
		item_id: 1,
		logged_date: date,
		status,
		notes: null,
		created_at: '2024-01-01 00:00:00'
	};
}

describe('calculateStreak', () => {
	it('returns 0 for empty entries', () => {
		expect(calculateStreak([])).toBe(0);
	});

	it('returns 0 when no done entries', () => {
		const entries = [createEntry('2024-01-01', 'skipped'), createEntry('2024-01-02', 'failed')];
		expect(calculateStreak(entries)).toBe(0);
	});

	it('calculates current streak correctly', () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const twoDaysAgo = new Date(today);
		twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

		const entries = [
			createEntry(twoDaysAgo.toISOString().split('T')[0], 'done'),
			createEntry(yesterday.toISOString().split('T')[0], 'done'),
			createEntry(today.toISOString().split('T')[0], 'done')
		];
		const streak = calculateStreak(entries);
		expect(streak).toBeGreaterThanOrEqual(2);
		expect(streak).toBeLessThanOrEqual(3);
	});

	it('stops streak at gap', () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const threeDaysAgo = new Date(today);
		threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

		const entries = [
			createEntry(threeDaysAgo.toISOString().split('T')[0], 'done'),
			createEntry(yesterday.toISOString().split('T')[0], 'done'),
			createEntry(today.toISOString().split('T')[0], 'done')
		];
		const streak = calculateStreak(entries);
		expect(streak).toBeLessThanOrEqual(2);
	});

	it('breaks when gap is more than 1 day', () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const fiveDaysAgo = new Date(today);
		fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
		const tenDaysAgo = new Date(today);
		tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

		const entries = [
			createEntry(tenDaysAgo.toISOString().split('T')[0], 'done'),
			createEntry(fiveDaysAgo.toISOString().split('T')[0], 'done'),
			createEntry(today.toISOString().split('T')[0], 'done')
		];
		const streak = calculateStreak(entries);
		expect(streak).toBe(1);
	});

	it('ignores skipped and failed entries', () => {
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const twoDaysAgo = new Date(today);
		twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

		const entries = [
			createEntry(twoDaysAgo.toISOString().split('T')[0], 'done'),
			createEntry(yesterday.toISOString().split('T')[0], 'skipped'),
			createEntry(today.toISOString().split('T')[0], 'done')
		];
		expect(calculateStreak(entries)).toBe(1);
	});

	it('handles future dates correctly', () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const entries = [
			createEntry(today.toISOString().split('T')[0], 'done'),
			createEntry(tomorrow.toISOString().split('T')[0], 'done')
		];
		const streak = calculateStreak(entries);
		expect(streak).toBeGreaterThanOrEqual(1);
	});
});

describe('calculateLongestStreak', () => {
	it('returns 0 for empty entries', () => {
		expect(calculateLongestStreak([])).toBe(0);
	});

	it('returns 1 for single entry', () => {
		const entries = [createEntry('2024-01-01', 'done')];
		expect(calculateLongestStreak(entries)).toBe(1);
	});

	it('calculates longest streak correctly', () => {
		const entries = [
			createEntry('2024-01-01', 'done'),
			createEntry('2024-01-02', 'done'),
			createEntry('2024-01-03', 'done'),
			createEntry('2024-01-05', 'done'),
			createEntry('2024-01-06', 'done')
		];
		expect(calculateLongestStreak(entries)).toBe(3);
	});

	it('ignores non-done entries', () => {
		const entries = [
			createEntry('2024-01-01', 'done'),
			createEntry('2024-01-02', 'skipped'),
			createEntry('2024-01-03', 'done'),
			createEntry('2024-01-04', 'done')
		];
		expect(calculateLongestStreak(entries)).toBe(2);
	});

	it('handles multiple streaks correctly', () => {
		const entries = [
			createEntry('2024-01-01', 'done'),
			createEntry('2024-01-02', 'done'),
			createEntry('2024-01-05', 'done'),
			createEntry('2024-01-06', 'done'),
			createEntry('2024-01-07', 'done')
		];
		expect(calculateLongestStreak(entries)).toBe(3);
	});
});

describe('calculateFrequency', () => {
	it('returns 0 done for empty entries', () => {
		expect(calculateFrequency([], 7)).toEqual({ done: 0, total: 7 });
	});

	it('calculates frequency correctly', () => {
		const today = new Date();
		const entries = [
			createEntry(today.toISOString().split('T')[0], 'done'),
			createEntry(
				new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				'done'
			),
			createEntry(
				new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				'done'
			)
		];
		const result = calculateFrequency(entries, 7);
		expect(result.done).toBe(3);
		expect(result.total).toBe(7);
	});

	it('excludes entries outside date range', () => {
		const today = new Date();
		const entries = [
			createEntry(today.toISOString().split('T')[0], 'done'),
			createEntry(
				new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				'done'
			)
		];
		const result = calculateFrequency(entries, 7);
		expect(result.done).toBe(1);
		expect(result.total).toBe(7);
	});

	it('counts only done entries', () => {
		const today = new Date();
		const entries = [
			createEntry(today.toISOString().split('T')[0], 'done'),
			createEntry(
				new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				'skipped'
			),
			createEntry(
				new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				'failed'
			),
			createEntry(
				new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				'done'
			)
		];
		const result = calculateFrequency(entries, 7);
		expect(result.done).toBe(2);
		expect(result.total).toBe(7);
	});
});
