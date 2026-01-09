import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CategoryCard from './CategoryCard.svelte';

describe('CategoryCard', () => {
	it('renders with correct name and count', async () => {
		render(CategoryCard, {
			name: 'Test Category',
			icon: '🧹',
			color: '#10b981',
			itemCount: 5
		});

		await expect.element(page.getByText('Test Category')).toBeInTheDocument();
		await expect.element(page.getByText('5 items')).toBeInTheDocument();
	});

	it('renders icon with correct color', async () => {
		const { container } = render(CategoryCard, {
			name: 'Test Category',
			icon: '🧹',
			color: '#10b981',
			itemCount: 5
		});

		const icon = container.querySelector('span[style*="color"]') as HTMLElement;
		expect(icon?.style.color).toBe('rgb(16, 185, 129)');
	});

	it('uses singular "item" for count of 1', async () => {
		render(CategoryCard, {
			name: 'Test Category',
			icon: '🧹',
			color: '#10b981',
			itemCount: 1
		});

		await expect.element(page.getByText('1 item')).toBeInTheDocument();
	});

	it('uses plural "items" for count other than 1', async () => {
		render(CategoryCard, {
			name: 'Test Category',
			icon: '🧹',
			color: '#10b981',
			itemCount: 0
		});

		await expect.element(page.getByText('0 items')).toBeInTheDocument();
	});

	it('renders as article when not interactive', async () => {
		render(CategoryCard, {
			name: 'Test Category',
			icon: '🧹',
			color: '#10b981',
			itemCount: 5
		});

		const article = page.getByRole('article');
		await expect.element(article).toBeInTheDocument();
	});

	it('renders as button when onclick is provided', async () => {
		const onclick = vi.fn();
		render(CategoryCard, {
			name: 'Test Category',
			icon: '🧹',
			color: '#10b981',
			itemCount: 5,
			onclick
		});

		const button = page.getByRole('button');
		await expect.element(button).toBeInTheDocument();
	});

	it('calls onclick when clicked', async () => {
		const onclick = vi.fn();
		render(CategoryCard, {
			name: 'Test Category',
			icon: '🧹',
			color: '#10b981',
			itemCount: 5,
			onclick
		});

		await page.getByRole('button').click();
		expect(onclick).toHaveBeenCalledOnce();
	});

	it('has accessible label with full context', async () => {
		render(CategoryCard, {
			name: 'Chores',
			icon: '🧹',
			color: '#10b981',
			itemCount: 3
		});

		const element = page.getByLabelText('Category: Chores, 3 items');
		await expect.element(element).toBeInTheDocument();
	});
});
