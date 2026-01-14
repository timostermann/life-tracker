import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TimeEstimateInput from './TimeEstimateInput.svelte';

describe('TimeEstimateInput', () => {
	it('renders with default label', async () => {
		render(TimeEstimateInput, {
			value: null,
			onValueChange: vi.fn()
		});

		await expect.element(page.getByText('Time Estimate')).toBeInTheDocument();
		await expect.element(page.getByPlaceholder('Minutes')).toBeInTheDocument();
	});

	it('renders with custom label', async () => {
		render(TimeEstimateInput, {
			value: null,
			onValueChange: vi.fn(),
			label: 'Estimated Time'
		});

		await expect.element(page.getByText('Estimated Time')).toBeInTheDocument();
	});

	it('displays current value', async () => {
		const { container } = render(TimeEstimateInput, {
			value: 60,
			onValueChange: vi.fn()
		});

		const input = container.querySelector('input[type="number"]') as HTMLInputElement;
		expect(input?.value).toBe('60');
	});

	it('calls onValueChange when value is entered', async () => {
		const onValueChange = vi.fn();

		const { container } = render(TimeEstimateInput, {
			value: null,
			onValueChange
		});

		const input = container.querySelector('input[type="number"]') as HTMLInputElement;
		input.value = '45';
		input.dispatchEvent(new Event('input', { bubbles: true }));

		expect(onValueChange).toHaveBeenCalledWith(45);
	});

	it('calls onValueChange with null when input is cleared', async () => {
		const onValueChange = vi.fn();

		const { container } = render(TimeEstimateInput, {
			value: 60,
			onValueChange
		});

		const input = container.querySelector('input[type="number"]') as HTMLInputElement;
		input.value = '';
		input.dispatchEvent(new Event('input', { bubbles: true }));

		expect(onValueChange).toHaveBeenCalledWith(null);
	});

	it('renders preset buttons', async () => {
		render(TimeEstimateInput, {
			value: null,
			onValueChange: vi.fn()
		});

		await expect.element(page.getByText('15m')).toBeInTheDocument();
		await expect.element(page.getByText('30m')).toBeInTheDocument();
		await expect.element(page.getByText('60m')).toBeInTheDocument();
		await expect.element(page.getByText('120m')).toBeInTheDocument();
	});

	it('calls onValueChange when preset is clicked', async () => {
		const onValueChange = vi.fn();

		render(TimeEstimateInput, {
			value: null,
			onValueChange
		});

		const presetButton = page.getByText('30m');
		await presetButton.click();

		expect(onValueChange).toHaveBeenCalledWith(30);
	});

	it('does not call onValueChange for invalid input', async () => {
		const onValueChange = vi.fn();

		const { container } = render(TimeEstimateInput, {
			value: null,
			onValueChange
		});

		const input = container.querySelector('input[type="number"]') as HTMLInputElement;
		input.value = '0';
		input.dispatchEvent(new Event('input', { bubbles: true }));

		// Should not call for 0 or negative
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('uses custom id when provided', async () => {
		const { container } = render(TimeEstimateInput, {
			value: null,
			onValueChange: vi.fn(),
			id: 'custom-time'
		});

		const input = container.querySelector('input[type="number"]') as HTMLInputElement;
		expect(input?.id).toBe('custom-time');
	});
});
