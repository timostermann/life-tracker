import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PriorityBadge from './PriorityBadge.svelte';

describe('PriorityBadge', () => {
	it('renders with urgent priority', async () => {
		render(PriorityBadge, {
			priority: 'urgent'
		});

		const badge = page.getByText('urgent');
		await expect.element(badge).toBeInTheDocument();
	});

	it('renders with high priority', async () => {
		render(PriorityBadge, {
			priority: 'high'
		});

		const badge = page.getByText('high');
		await expect.element(badge).toBeInTheDocument();
	});

	it('renders with medium priority', async () => {
		render(PriorityBadge, {
			priority: 'medium'
		});

		const badge = page.getByText('medium');
		await expect.element(badge).toBeInTheDocument();
	});

	it('renders with low priority', async () => {
		render(PriorityBadge, {
			priority: 'low'
		});

		const badge = page.getByText('low');
		await expect.element(badge).toBeInTheDocument();
	});

	it('hides label when showLabel is false', async () => {
		const { container } = render(PriorityBadge, {
			priority: 'urgent',
			showLabel: false
		});

		const badge = container.querySelector('[aria-label="Priority: urgent"]');
		expect(badge).toBeTruthy();
		// Text should not be present
		expect(badge?.textContent).toBe('');
	});

	it('has accessible label', async () => {
		render(PriorityBadge, {
			priority: 'urgent'
		});

		const badge = page.getByLabelText('Priority: urgent');
		await expect.element(badge).toBeInTheDocument();
	});
});
