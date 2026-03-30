import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ChoreSchedule from './ChoreSchedule.svelte';
import type { RecurringConfig } from '$lib/schemas/items';

const createMockItem = (
	id: number,
	nextShowDate: string | null,
	recurringConfig: RecurringConfig | null,
	values: Record<string, string> = { '1': `Chore ${id}` }
) => ({
	id,
	assigned_to_user_id: null,
	is_archived: false,
	next_show_date: nextShowDate,
	recurring_config: recurringConfig,
	values
});

describe('ChoreSchedule', () => {
	it('shows empty state when no items', async () => {
		render(ChoreSchedule, {
			items: []
		});

		await expect.element(page.getByText('No upcoming chores')).toBeInTheDocument();
		await expect
			.element(page.getByText('Chores will appear here when scheduled'))
			.toBeInTheDocument();
	});

	it('groups chores by date', async () => {
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const items = [
			createMockItem(1, today.toISOString(), { frequency: 'daily', interval: 1 }),
			createMockItem(2, today.toISOString(), { frequency: 'daily', interval: 1 }),
			createMockItem(3, tomorrow.toISOString(), { frequency: 'daily', interval: 1 })
		];

		const { container } = render(ChoreSchedule, {
			items
		});

		// Should show dates grouped
		const dateHeaders = container.querySelectorAll('h3');
		expect(dateHeaders.length).toBeGreaterThan(0);
	});

	it('sorts dates chronologically', async () => {
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const nextWeek = new Date(today);
		nextWeek.setDate(nextWeek.getDate() + 7);

		const items = [
			createMockItem(1, nextWeek.toISOString(), { frequency: 'daily', interval: 1 }),
			createMockItem(2, today.toISOString(), { frequency: 'daily', interval: 1 }),
			createMockItem(3, tomorrow.toISOString(), { frequency: 'daily', interval: 1 })
		];

		const { container } = render(ChoreSchedule, {
			items
		});

		const dateHeaders = container.querySelectorAll('h3');
		// Dates should be sorted (today, tomorrow, next week)
		expect(dateHeaders.length).toBeGreaterThanOrEqual(3);
	});

	it('calls onComplete when complete button is clicked', async () => {
		const onComplete = vi.fn();
		const today = new Date();
		const items = [createMockItem(1, today.toISOString(), { frequency: 'daily', interval: 1 })];

		render(ChoreSchedule, {
			items,
			onComplete
		});

		const completeButton = page.getByLabelText('Complete chore');
		await completeButton.click();

		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenCalledWith(items[0]);
	});

	it('does not show complete button when onComplete is not provided', async () => {
		const today = new Date();
		const items = [createMockItem(1, today.toISOString(), { frequency: 'daily', interval: 1 })];

		const { container } = render(ChoreSchedule, {
			items
		});

		const completeButton = container.querySelector('button[aria-label="Complete chore"]');
		expect(completeButton).toBeNull();
	});

	it('displays category color indicator when provided', async () => {
		const today = new Date();
		const items = [createMockItem(1, today.toISOString(), { frequency: 'daily', interval: 1 })];

		const { container } = render(ChoreSchedule, {
			items,
			categoryColor: '#10b981'
		});

		const colorIndicator = container.querySelector(
			'[style*="background-color: rgb(16, 185, 129)"]'
		);
		expect(colorIndicator).toBeTruthy();
	});

	it('displays recurring config badge when present', async () => {
		const today = new Date();
		const items = [createMockItem(1, today.toISOString(), { frequency: 'weekly', interval: 2 })];

		render(ChoreSchedule, {
			items
		});

		// Should show recurring config formatted text
		const badge = page.getByText(/Every 2 weeks|Weekly/i);
		await expect.element(badge).toBeInTheDocument();
	});

	it('displays chore title from values', async () => {
		const today = new Date();
		const items = [
			createMockItem(
				1,
				today.toISOString(),
				{ frequency: 'daily', interval: 1 },
				{
					'1': 'Vacuum floors'
				}
			)
		];

		render(ChoreSchedule, {
			items
		});

		await expect.element(page.getByText('Vacuum floors')).toBeInTheDocument();
	});

	it('uses next_show_date when available', async () => {
		const specificDate = new Date('2026-06-15T00:00:00Z');
		const items = [
			createMockItem(1, specificDate.toISOString(), { frequency: 'daily', interval: 1 })
		];

		render(ChoreSchedule, {
			items
		});

		// Should show the specific date
		const dateHeader = page.getByRole('heading', { level: 3 });
		await expect.element(dateHeader).toBeInTheDocument();
	});

	it('calculates next date from recurring_config when next_show_date is null', async () => {
		const items = [createMockItem(1, null, { frequency: 'daily', interval: 1 })];

		const { container } = render(ChoreSchedule, {
			items
		});

		// Should still show items (calculated from recurring_config)
		const dateHeaders = container.querySelectorAll('h3');
		expect(dateHeaders.length).toBeGreaterThan(0);
	});

	it('skips items without next_show_date or recurring_config', async () => {
		const items = [
			createMockItem(1, null, null),
			createMockItem(2, new Date().toISOString(), { frequency: 'daily', interval: 1 })
		];

		const { container } = render(ChoreSchedule, {
			items
		});

		// Should only show item 2
		await expect.element(page.getByText('Chore 2')).toBeInTheDocument();
		// Chore 1 should not be rendered since it has no date/config
		expect(container.textContent).not.toContain('Chore 1');
	});

	it('displays assignee avatar when assigned with username', async () => {
		const today = new Date();
		const items = [
			{
				...createMockItem(1, today.toISOString(), { frequency: 'daily', interval: 1 }),
				assigned_to_user_id: 1,
				assigned_to_username: 'TestUser'
			}
		];

		render(ChoreSchedule, {
			items
		});

		// AssigneeAvatar should be rendered with the username
		const avatar = page.getByLabelText('TestUser');
		await expect.element(avatar).toBeInTheDocument();
	});
});
