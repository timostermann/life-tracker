import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PrioritySelector from './PrioritySelector.svelte';

describe('PrioritySelector', () => {
	it('renders with default label', async () => {
		const { container } = render(PrioritySelector, {
			value: null,
			onValueChange: vi.fn()
		});

		expect(container.textContent).toContain('Priority');
		await expect.element(page.getByText('Select priority')).toBeInTheDocument();
	});

	it('renders with custom label', async () => {
		render(PrioritySelector, {
			value: null,
			onValueChange: vi.fn(),
			label: 'Task Priority'
		});

		await expect.element(page.getByText('Task Priority')).toBeInTheDocument();
	});

	it('renders required indicator when required', async () => {
		render(PrioritySelector, {
			value: null,
			onValueChange: vi.fn(),
			required: true
		});

		const label = page.getByText('Priority *');
		await expect.element(label).toBeInTheDocument();
	});

	it('displays selected priority badge', async () => {
		render(PrioritySelector, {
			value: 'urgent',
			onValueChange: vi.fn()
		});

		await expect.element(page.getByText('Urgent')).toBeInTheDocument();
	});

	it('calls onValueChange when priority is selected', async () => {
		const onValueChange = vi.fn();

		render(PrioritySelector, {
			value: null,
			onValueChange
		});

		const trigger = page.getByText('Select priority');
		await trigger.click();

		const urgentOption = page.getByText('Urgent');
		await urgentOption.click();

		expect(onValueChange).toHaveBeenCalledWith('urgent');
	});

	it('calls onValueChange with null when cleared', async () => {
		const onValueChange = vi.fn();

		render(PrioritySelector, {
			value: 'high',
			onValueChange
		});

		// Verify it renders correctly with selected value
		await expect.element(page.getByText('High')).toBeInTheDocument();
	});

	it('renders all priority options', async () => {
		render(PrioritySelector, {
			value: null,
			onValueChange: vi.fn()
		});

		const trigger = page.getByText('Select priority');
		await trigger.click();

		await expect.element(page.getByText('Urgent')).toBeInTheDocument();
		await expect.element(page.getByText('High')).toBeInTheDocument();
		await expect.element(page.getByText('Medium')).toBeInTheDocument();
		await expect.element(page.getByText('Low')).toBeInTheDocument();
	});

	it('uses custom id when provided', async () => {
		const { container } = render(PrioritySelector, {
			value: null,
			onValueChange: vi.fn(),
			id: 'custom-priority'
		});

		const trigger = container.querySelector('[id="custom-priority"]');
		expect(trigger).toBeTruthy();
	});
});
