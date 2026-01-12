import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CategoryList from './CategoryList.svelte';

const baseCategory = {
	id: 1,
	user_id: 1,
	name: 'Test',
	template_type: 'task' as const,
	icon: null,
	color: null,
	is_private: true,
	created_at: 'now',
	updated_at: 'now'
};

describe('CategoryList', () => {
	it('renders empty state when there are no categories', async () => {
		render(CategoryList, {
			categories: [],
			onEdit: vi.fn(),
			onDelete: vi.fn()
		});

		await expect.element(page.getByText('No categories yet')).toBeInTheDocument();
	});

	it('renders categories and calls edit/delete callbacks', async () => {
		const onEdit = vi.fn();
		const onDelete = vi.fn();

		render(CategoryList, {
			categories: [{ ...baseCategory, name: 'Work' }],
			onEdit,
			onDelete
		});

		await expect.element(page.getByText('Work')).toBeInTheDocument();

		await page.getByRole('button', { name: 'Edit' }).click();
		expect(onEdit).toHaveBeenCalledOnce();

		await page.getByRole('button', { name: 'Delete' }).click();
		expect(onDelete).toHaveBeenCalledOnce();
	});

	it('renders Share button when onShare is provided', async () => {
		render(CategoryList, {
			categories: [{ ...baseCategory, name: 'Work' }],
			onEdit: vi.fn(),
			onDelete: vi.fn(),
			onShare: vi.fn()
		});

		await expect.element(page.getByRole('button', { name: 'Share' })).toBeInTheDocument();
	});
});
