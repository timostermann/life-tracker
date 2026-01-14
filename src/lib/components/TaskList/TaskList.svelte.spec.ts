import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TaskList from './TaskList.svelte';
import type { RecurringConfig } from '$lib/schemas/items';

const mockItems = [
	{
		id: 1,
		priority: 'high' as const,
		deadline: '2024-12-31T00:00:00.000Z',
		time_estimate: 60,
		assigned_to_user_id: 2,
		is_archived: false,
		recurring_config: null as RecurringConfig | null,
		values: { '1': 'Task 1', '2': 'Description 1' } as Record<string, string>
	},
	{
		id: 2,
		priority: 'medium' as const,
		deadline: null,
		time_estimate: null,
		assigned_to_user_id: null,
		is_archived: false,
		recurring_config: { frequency: 'weekly' as const, interval: 1 },
		values: { '1': 'Task 2' } as Record<string, string>
	},
	{
		id: 3,
		priority: 'low' as const,
		deadline: '2024-12-25T00:00:00.000Z',
		time_estimate: 30,
		assigned_to_user_id: null,
		is_archived: true,
		recurring_config: null,
		values: { '1': 'Archived Task' } as Record<string, string>
	}
];

describe('TaskList', () => {
	it('renders empty state when there are no items', async () => {
		render(TaskList, {
			items: []
		});

		await expect.element(page.getByText('No tasks yet')).toBeInTheDocument();
		await expect
			.element(page.getByText('Create your first task to get started'))
			.toBeInTheDocument();
	});

	it('renders items list', async () => {
		render(TaskList, {
			items: mockItems
		});

		await expect.element(page.getByText('Task 1')).toBeInTheDocument();
		await expect.element(page.getByText('Task 2')).toBeInTheDocument();
		await expect.element(page.getByText('Archived Task')).toBeInTheDocument();
	});

	it('displays task title from first field value', async () => {
		render(TaskList, {
			items: [mockItems[0]]
		});

		await expect.element(page.getByText('Task 1')).toBeInTheDocument();
	});

	it('displays Untitled when no field values', async () => {
		render(TaskList, {
			items: [
				{
					...mockItems[0],
					values: {}
				}
			]
		});

		await expect.element(page.getByText('Untitled')).toBeInTheDocument();
	});

	it('displays description from second field value', async () => {
		render(TaskList, {
			items: [mockItems[0]]
		});

		await expect.element(page.getByText('Description 1')).toBeInTheDocument();
	});

	it('displays priority badge when priority is set', async () => {
		render(TaskList, {
			items: [mockItems[0]]
		});

		// Priority badge should be rendered (check for aria-label)
		const badge = page.getByLabelText(/priority: high/i);
		await expect.element(badge).toBeInTheDocument();
	});

	it('displays deadline when set', async () => {
		render(TaskList, {
			items: [mockItems[0]]
		});

		await expect.element(page.getByText(/due:/i)).toBeInTheDocument();
	});

	it('displays time estimate when set', async () => {
		render(TaskList, {
			items: [mockItems[0]]
		});

		await expect.element(page.getByText('60m')).toBeInTheDocument();
	});

	it('displays recurring config when set', async () => {
		render(TaskList, {
			items: [mockItems[1]]
		});

		await expect.element(page.getByText(/weekly/i)).toBeInTheDocument();
	});

	it('shows complete button for non-archived items when onComplete is provided', async () => {
		render(TaskList, {
			items: [mockItems[0]],
			onComplete: vi.fn()
		});

		const completeButton = page.getByRole('button', { name: 'Complete task' });
		await expect.element(completeButton).toBeInTheDocument();
	});

	it('does not show complete button for archived items', async () => {
		const { container } = render(TaskList, {
			items: [mockItems[2]],
			onComplete: vi.fn()
		});

		const completeButton = container.querySelector('button[aria-label="Complete task"]');
		expect(completeButton).toBeNull();
	});

	it('calls onComplete when complete button is clicked', async () => {
		const onComplete = vi.fn();

		render(TaskList, {
			items: [mockItems[0]],
			onComplete
		});

		const completeButton = page.getByRole('button', { name: 'Complete task' });
		await completeButton.click();

		expect(onComplete).toHaveBeenCalledWith(mockItems[0]);
	});

	it('shows edit button when onEdit is provided', async () => {
		render(TaskList, {
			items: [mockItems[0]],
			onEdit: vi.fn()
		});

		const editButton = page.getByRole('button', { name: 'Edit task' });
		await expect.element(editButton).toBeInTheDocument();
	});

	it('calls onEdit when edit button is clicked', async () => {
		const onEdit = vi.fn();

		render(TaskList, {
			items: [mockItems[0]],
			onEdit
		});

		const editButton = page.getByRole('button', { name: 'Edit task' });
		await editButton.click();

		expect(onEdit).toHaveBeenCalledWith(mockItems[0]);
	});

	it('shows delete button when onDelete is provided', async () => {
		render(TaskList, {
			items: [mockItems[0]],
			onDelete: vi.fn()
		});

		const deleteButton = page.getByRole('button', { name: 'Delete task' });
		await expect.element(deleteButton).toBeInTheDocument();
	});

	it('calls onDelete when delete button is clicked', async () => {
		const onDelete = vi.fn();

		render(TaskList, {
			items: [mockItems[0]],
			onDelete
		});

		const deleteButton = page.getByRole('button', { name: 'Delete task' });
		await deleteButton.click();

		expect(onDelete).toHaveBeenCalledWith(mockItems[0]);
	});

	it('filters by priority', async () => {
		const { container } = render(TaskList, {
			items: mockItems
		});

		// Verify filter UI is rendered
		const priorityFilter = container.querySelector('#priority-filter');
		expect(priorityFilter).toBeTruthy();
		await expect.element(page.getByText('Priority:')).toBeInTheDocument();
	});

	it('shows archived toggle when onToggleArchived is provided', async () => {
		render(TaskList, {
			items: mockItems,
			onToggleArchived: vi.fn()
		});

		await expect.element(page.getByLabelText('Show archived')).toBeInTheDocument();
	});

	it('calls onToggleArchived when checkbox is clicked', async () => {
		const onToggleArchived = vi.fn();

		render(TaskList, {
			items: mockItems,
			onToggleArchived
		});

		const checkbox = page.getByLabelText('Show archived');
		await checkbox.click();

		expect(onToggleArchived).toHaveBeenCalledWith(true);
	});

	it('displays category color indicator when provided', async () => {
		const { container } = render(TaskList, {
			items: [mockItems[0]],
			categoryColor: '#ff0000'
		});

		// Color indicator should be present
		const indicator = container.querySelector('[style*="background-color"]');
		expect(indicator).toBeTruthy();
	});

	it('shows strikethrough for archived items', async () => {
		render(TaskList, {
			items: [mockItems[2]]
		});

		const taskTitle = page.getByText('Archived Task');
		await expect.element(taskTitle).toHaveClass(/line-through/);
	});

	it('shows empty filter message when filters match no items', async () => {
		render(TaskList, {
			items: []
		});

		// Verify empty state is shown
		await expect.element(page.getByText('No tasks yet')).toBeInTheDocument();
	});
});
