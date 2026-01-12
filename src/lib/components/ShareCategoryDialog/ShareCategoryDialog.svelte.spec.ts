import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ShareCategoryDialog from './ShareCategoryDialog.svelte';

describe('ShareCategoryDialog', () => {
	it('renders without crashing when closed', () => {
		const { container } = render(ShareCategoryDialog, {
			open: false,
			categoryId: 1,
			categoryName: 'Test Category'
		});

		expect(container).toBeDefined();
	});

	it('renders with different category IDs', () => {
		const { container } = render(ShareCategoryDialog, {
			open: false,
			categoryId: 999,
			categoryName: 'Another Category'
		});

		expect(container).toBeDefined();
	});

	it('renders with special characters in category name', () => {
		const { container } = render(ShareCategoryDialog, {
			open: false,
			categoryId: 1,
			categoryName: 'Test & "Special" Category'
		});

		expect(container).toBeDefined();
	});

	it('renders with onClose callback', () => {
		const onClose = () => {};
		const { container } = render(ShareCategoryDialog, {
			open: false,
			categoryId: 1,
			categoryName: 'Test',
			onClose
		});

		expect(container).toBeDefined();
	});

	it('renders when initially open', () => {
		const { container } = render(ShareCategoryDialog, {
			open: true,
			categoryId: 1,
			categoryName: 'Test'
		});

		expect(container).toBeDefined();
	});
});
