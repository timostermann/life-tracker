import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AssigneeAvatar from './AssigneeAvatar.svelte';

describe('AssigneeAvatar', () => {
	it('renders with initials from name', async () => {
		render(AssigneeAvatar, {
			name: 'John Doe'
		});

		const avatar = page.getByText('JD');
		await expect.element(avatar).toBeInTheDocument();
	});

	it('renders initials for single name', async () => {
		render(AssigneeAvatar, {
			name: 'Alice'
		});

		const avatar = page.getByText('A');
		await expect.element(avatar).toBeInTheDocument();
	});

	it('renders with custom color', async () => {
		const { container } = render(AssigneeAvatar, {
			name: 'John Doe',
			color: '#ff0000'
		});

		const avatar = container.querySelector('[role="img"]') as HTMLElement;
		expect(avatar?.style.backgroundColor).toBe('rgb(255, 0, 0)');
	});

	it('has accessible label with full name', async () => {
		render(AssigneeAvatar, {
			name: 'John Doe'
		});

		const avatar = page.getByLabelText('John Doe');
		await expect.element(avatar).toBeInTheDocument();
	});

	it('renders image when imageUrl is provided', async () => {
		render(AssigneeAvatar, {
			name: 'John Doe',
			imageUrl: 'https://example.com/avatar.jpg'
		});

		const img = page.getByAltText('John Doe');
		await expect.element(img).toBeInTheDocument();
		await expect.element(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
	});

	it('renders small size correctly', async () => {
		const { container } = render(AssigneeAvatar, {
			name: 'John Doe',
			size: 'sm'
		});

		const avatar = container.querySelector('[role="img"]') as HTMLElement;
		expect(avatar?.classList.contains('h-6')).toBe(true);
		expect(avatar?.classList.contains('w-6')).toBe(true);
	});

	it('renders large size correctly', async () => {
		const { container } = render(AssigneeAvatar, {
			name: 'John Doe',
			size: 'lg'
		});

		const avatar = container.querySelector('[role="img"]') as HTMLElement;
		expect(avatar?.classList.contains('h-12')).toBe(true);
		expect(avatar?.classList.contains('w-12')).toBe(true);
	});
});
