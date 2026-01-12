import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ItemCard from './ItemCard.svelte';

describe('ItemCard', () => {
	it('renders with title', async () => {
		render(ItemCard, {
			title: 'Test Task'
		});

		await expect.element(page.getByText('Test Task')).toBeInTheDocument();
	});

	it('renders with description', async () => {
		render(ItemCard, {
			title: 'Test Task',
			description: 'This is a description'
		});

		await expect.element(page.getByText('This is a description')).toBeInTheDocument();
	});

	it('renders priority badge when priority is provided', async () => {
		const { container } = render(ItemCard, {
			title: 'Test Task',
			priority: 'urgent'
		});

		const badge = container.querySelector('[aria-label="Priority: urgent"]');
		expect(badge).toBeTruthy();
	});

	it('renders due date when provided', async () => {
		const dueDate = new Date(2026, 0, 15);
		render(ItemCard, {
			title: 'Test Task',
			dueDate
		});

		const timeElement = page.getByText(/Due: Jan 15, 2026/);
		await expect.element(timeElement).toBeInTheDocument();
	});

	it('shows checkbox when ontoggle is provided', async () => {
		const ontoggle = vi.fn();
		render(ItemCard, {
			title: 'Test Task',
			ontoggle
		});

		const checkbox = page.getByLabelText('Mark as complete');
		await expect.element(checkbox).toBeInTheDocument();
	});

	it('applies line-through style when completed', async () => {
		render(ItemCard, {
			title: 'Test Task',
			completed: true
		});

		const title = page.getByText('Test Task');
		await expect.element(title).toHaveClass('line-through');
	});

	it('shows category color indicator when provided', async () => {
		const { container } = render(ItemCard, {
			title: 'Test Task',
			categoryColor: '#3b82f6'
		});

		const colorIndicator = container.querySelector(
			'[style*="background-color: rgb(59, 130, 246)"]'
		);
		expect(colorIndicator).toBeTruthy();
	});

	it('has aria-describedby when description is provided', async () => {
		const { container } = render(ItemCard, {
			title: 'Test Task',
			description: 'Test description'
		});

		const article = container.querySelector('article');
		const describedById = article?.getAttribute('aria-describedby');
		expect(describedById).toBeTruthy();

		const descriptionElement = container.querySelector(`#${describedById}`);
		expect(descriptionElement?.textContent).toBe('Test description');
	});
});
