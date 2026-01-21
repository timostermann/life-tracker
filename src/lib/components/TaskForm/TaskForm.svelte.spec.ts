import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TaskForm from './TaskForm.svelte';
import type { Field } from '$lib/schemas';

const mockFields: Field[] = [
	{
		id: 1,
		category_id: 1,
		name: 'Task Title*',
		field_type: 'text',
		options: null,
		field_order: 0,
		created_at: '2024-01-01'
	},
	{
		id: 2,
		category_id: 1,
		name: 'Description',
		field_type: 'text',
		options: null,
		field_order: 1,
		created_at: '2024-01-01'
	},
	{
		id: 3,
		category_id: 1,
		name: 'Amount',
		field_type: 'number',
		options: null,
		field_order: 2,
		created_at: '2024-01-01'
	},
	{
		id: 4,
		category_id: 1,
		name: 'Completed',
		field_type: 'boolean',
		options: null,
		field_order: 3,
		created_at: '2024-01-01'
	}
];

describe('TaskForm', () => {
	it('renders form with fields', async () => {
		render(TaskForm, {
			fields: mockFields,
			onSubmit: vi.fn(),
			onCancel: vi.fn()
		});

		await expect.element(page.getByText('Task Details')).toBeInTheDocument();
		await expect.element(page.getByText('Task Settings')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Task Title*')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Description')).toBeInTheDocument();
	});

	it('renders text input for text fields', async () => {
		const { container } = render(TaskForm, {
			fields: mockFields,
			onSubmit: vi.fn(),
			onCancel: vi.fn()
		});

		const titleInput = container.querySelector('input[id="field-1"]') as HTMLInputElement;
		expect(titleInput?.type).toBe('text');
	});

	it('renders number input for number fields', async () => {
		render(TaskForm, {
			fields: mockFields,
			onSubmit: vi.fn(),
			onCancel: vi.fn()
		});

		const amountInput = page.getByLabelText('Amount');
		await expect.element(amountInput).toHaveAttribute('type', 'number');
	});

	it('renders checkbox for boolean fields', async () => {
		render(TaskForm, {
			fields: mockFields,
			onSubmit: vi.fn(),
			onCancel: vi.fn()
		});

		const checkbox = page.getByRole('checkbox', { name: 'Completed' });
		await expect.element(checkbox).toBeInTheDocument();
		await expect.element(checkbox).toHaveAttribute('role', 'checkbox');
	});

	it('displays initial data when provided', async () => {
		const { container } = render(TaskForm, {
			fields: mockFields,
			initialData: {
				id: 1,
				priority: 'high',
				deadline: '2024-12-31T00:00:00.000Z',
				time_estimate: 60,
				assigned_to_user_id: 2,
				values: { '1': 'Test Task', '2': 'Test Description' }
			},
			onSubmit: vi.fn(),
			onCancel: vi.fn()
		});

		const titleInput = container.querySelector('input[id="field-1"]') as HTMLInputElement;
		expect(titleInput?.value).toBe('Test Task');
	});

	it('shows Update button when initialData is provided', async () => {
		render(TaskForm, {
			fields: mockFields,
			initialData: {
				id: 1,
				values: {}
			},
			onSubmit: vi.fn(),
			onCancel: vi.fn()
		});

		await expect.element(page.getByRole('button', { name: 'Update Task' })).toBeInTheDocument();
	});

	it('shows Create button when initialData is not provided', async () => {
		render(TaskForm, {
			fields: mockFields,
			onSubmit: vi.fn(),
			onCancel: vi.fn()
		});

		await expect.element(page.getByRole('button', { name: 'Create Task' })).toBeInTheDocument();
	});

	it('calls onSubmit with form data when submitted', async () => {
		const onSubmit = vi.fn();

		render(TaskForm, {
			fields: mockFields,
			onSubmit,
			onCancel: vi.fn()
		});

		const titleInput = page.getByLabelText('Task Title*');
		await titleInput.fill('Test Task');

		const submitButton = page.getByRole('button', { name: 'Create Task' });
		await submitButton.click();

		expect(onSubmit).toHaveBeenCalled();
		const callArgs = onSubmit.mock.calls[0][0];
		expect(callArgs.values['1']).toBe('Test Task');
	});

	it('calls onCancel when cancel button is clicked', async () => {
		const onCancel = vi.fn();

		render(TaskForm, {
			fields: mockFields,
			onSubmit: vi.fn(),
			onCancel
		});

		const cancelButton = page.getByRole('button', { name: 'Cancel' });
		await cancelButton.click();

		expect(onCancel).toHaveBeenCalledOnce();
	});

	it('displays validation errors for required fields', async () => {
		render(TaskForm, {
			fields: mockFields,
			onSubmit: vi.fn(),
			onCancel: vi.fn()
		});

		const submitButton = page.getByRole('button', { name: 'Create Task' });
		await submitButton.click();

		// Should show error for required field
		await expect.element(page.getByText(/Task Title\* is required/i)).toBeInTheDocument();
	});

	it('does not submit when validation fails', async () => {
		const onSubmit = vi.fn();

		render(TaskForm, {
			fields: mockFields,
			onSubmit,
			onCancel: vi.fn()
		});

		const submitButton = page.getByRole('button', { name: 'Create Task' });
		await submitButton.click();

		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('disables submit button when loading', async () => {
		const onSubmit = vi.fn(async () => {
			await new Promise(() => {}); // Never resolves
		});

		render(TaskForm, {
			fields: mockFields,
			onSubmit,
			onCancel: vi.fn()
		});

		const titleInput = page.getByLabelText('Task Title*');
		await titleInput.fill('Test Task');

		const submitButton = page.getByRole('button', { name: 'Create Task' });
		await submitButton.click();

		// Button should be disabled during loading
		await expect.element(submitButton).toBeDisabled();
	});

	it('renders all task settings components', async () => {
		const { container } = render(TaskForm, {
			fields: mockFields,
			onSubmit: vi.fn(),
			onCancel: vi.fn()
		});

		expect(container.textContent).toContain('Priority');
		expect(container.textContent).toContain('Assign to');
		expect(container.textContent).toContain('Deadline');
		expect(container.textContent).toContain('Time Estimate');
		expect(container.textContent).toMatch(/recurring/i);
	});
});
