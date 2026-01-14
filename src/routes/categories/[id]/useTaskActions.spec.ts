import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaskActions } from './useTaskActions.svelte';
import * as api from '$lib/utils/api';
import type { RecurringConfig } from '$lib/schemas/items';

vi.mock('$lib/utils/api');

const mockItem = {
	id: 1,
	priority: 'high' as const,
	deadline: '2024-12-31T00:00:00.000Z',
	time_estimate: 60,
	assigned_to_user_id: 2,
	is_archived: false,
	recurring_config: null as RecurringConfig | null,
	values: { '1': 'Test Task' }
};

describe('useTaskActions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('initialization', () => {
		it('should initialize with all dialogs closed', () => {
			const actions = useTaskActions(1);

			expect(actions.createDialogOpen.value).toBe(false);
			expect(actions.editDialogOpen.value).toBe(false);
			expect(actions.deleteDialogOpen.value).toBe(false);
			expect(actions.selectedItem).toBeNull();
		});

		it('should accept categoryId as number', () => {
			const actions = useTaskActions(1);
			expect(actions.createDialogOpen.value).toBe(false);
		});

		it('should accept categoryId as getter function', () => {
			const actions = useTaskActions(() => 1);
			expect(actions.createDialogOpen.value).toBe(false);
		});
	});

	describe('handleCreate', () => {
		it('should create task and close dialog on success', async () => {
			vi.mocked(api.createResource).mockResolvedValue({ success: true });

			const actions = useTaskActions(1);

			await actions.handleCreate({
				priority: 'high',
				values: { '1': 'Test Task' }
			});

			expect(api.createResource).toHaveBeenCalledWith(
				'/api/categories/1/items',
				{ priority: 'high', values: { '1': 'Test Task' } },
				{
					successMessage: 'Task created successfully',
					errorMessage: 'Failed to create task'
				}
			);
			expect(actions.createDialogOpen.value).toBe(false);
		});

		it('should not close dialog on failure', async () => {
			vi.mocked(api.createResource).mockResolvedValue({ success: false });

			const actions = useTaskActions(1);
			actions.openCreate();

			await actions.handleCreate({
				priority: 'high',
				values: { '1': 'Test Task' }
			});

			expect(actions.createDialogOpen.value).toBe(true);
		});

		it('should use getter function for categoryId', async () => {
			vi.mocked(api.createResource).mockResolvedValue({ success: true });

			let categoryId = 1;
			const actions = useTaskActions(() => categoryId);

			await actions.handleCreate({
				priority: 'high',
				values: { '1': 'Test Task' }
			});

			expect(api.createResource).toHaveBeenCalledWith(
				'/api/categories/1/items',
				expect.any(Object),
				expect.any(Object)
			);

			categoryId = 2;
			await actions.handleCreate({
				priority: 'high',
				values: { '1': 'Test Task' }
			});

			expect(api.createResource).toHaveBeenCalledWith(
				'/api/categories/2/items',
				expect.any(Object),
				expect.any(Object)
			);
		});
	});

	describe('handleEdit (openEdit)', () => {
		it('should fetch item and open edit dialog on success', async () => {
			vi.mocked(api.fetchResource).mockResolvedValue({
				success: true,
				data: { item: mockItem }
			});

			const actions = useTaskActions(1);

			await actions.openEdit(mockItem);

			expect(api.fetchResource).toHaveBeenCalledWith('/api/items/1', {
				errorMessage: 'Failed to load task'
			});
			expect(actions.editDialogOpen.value).toBe(true);
			expect(actions.selectedItem).toEqual(mockItem);
		});

		it('should not open dialog on failure', async () => {
			vi.mocked(api.fetchResource).mockResolvedValue({
				success: false
			});

			const actions = useTaskActions(1);

			await actions.openEdit(mockItem);

			expect(actions.editDialogOpen.value).toBe(false);
		});
	});

	describe('handleUpdate', () => {
		it('should update task and close dialog on success', async () => {
			vi.mocked(api.fetchResource).mockResolvedValue({
				success: true,
				data: { item: mockItem }
			});
			vi.mocked(api.updateResource).mockResolvedValue({ success: true });

			const actions = useTaskActions(1);
			await actions.openEdit(mockItem);

			await actions.handleEdit({
				priority: 'urgent',
				values: { '1': 'Updated Task' }
			});

			expect(api.updateResource).toHaveBeenCalledWith(
				'/api/items/1',
				{ priority: 'urgent', values: { '1': 'Updated Task' } },
				{
					successMessage: 'Task updated successfully',
					errorMessage: 'Failed to update task'
				}
			);
			expect(actions.editDialogOpen.value).toBe(false);
		});

		it('should not update if no selected item', async () => {
			const actions = useTaskActions(1);

			await actions.handleEdit({
				priority: 'urgent',
				values: { '1': 'Updated Task' }
			});

			expect(api.updateResource).not.toHaveBeenCalled();
		});

		it('should not close dialog on failure', async () => {
			vi.mocked(api.fetchResource).mockResolvedValue({
				success: true,
				data: { item: mockItem }
			});
			vi.mocked(api.updateResource).mockResolvedValue({ success: false });

			const actions = useTaskActions(1);
			await actions.openEdit(mockItem);

			await actions.handleEdit({
				priority: 'urgent',
				values: { '1': 'Updated Task' }
			});

			expect(actions.editDialogOpen.value).toBe(true);
		});
	});

	describe('handleDelete', () => {
		it('should delete task and close dialog on success', async () => {
			vi.mocked(api.deleteResource).mockResolvedValue({ success: true });

			const actions = useTaskActions(1);
			actions.openDelete(mockItem);

			await actions.handleDelete();

			expect(api.deleteResource).toHaveBeenCalledWith('/api/items/1', {
				successMessage: 'Task deleted successfully',
				errorMessage: 'Failed to delete task'
			});
			expect(actions.deleteDialogOpen.value).toBe(false);
		});

		it('should not delete if no selected item', async () => {
			const actions = useTaskActions(1);

			await actions.handleDelete();

			expect(api.deleteResource).not.toHaveBeenCalled();
		});

		it('should not close dialog on failure', async () => {
			vi.mocked(api.deleteResource).mockResolvedValue({ success: false });

			const actions = useTaskActions(1);
			actions.openDelete(mockItem);

			await actions.handleDelete();

			expect(actions.deleteDialogOpen.value).toBe(true);
		});
	});

	describe('handleComplete', () => {
		it('should complete task and return success', async () => {
			vi.mocked(api.createResource).mockResolvedValue({ success: true });

			const actions = useTaskActions(1);

			const result = await actions.handleComplete(mockItem);

			expect(api.createResource).toHaveBeenCalledWith(
				'/api/items/1/complete',
				{},
				{
					successMessage: 'Task completed',
					errorMessage: 'Failed to complete task'
				}
			);
			expect(result).toBe(true);
		});

		it('should show different message for recurring tasks', async () => {
			vi.mocked(api.createResource).mockResolvedValue({ success: true });

			const actions = useTaskActions(1);
			const recurringItem = {
				...mockItem,
				recurring_config: { frequency: 'weekly' as const, interval: 1 }
			};

			await actions.handleComplete(recurringItem);

			expect(api.createResource).toHaveBeenCalledWith(
				'/api/items/1/complete',
				{},
				{
					successMessage: 'Task completed. Next occurrence created.',
					errorMessage: 'Failed to complete task'
				}
			);
		});

		it('should return false on failure', async () => {
			vi.mocked(api.createResource).mockResolvedValue({ success: false });

			const actions = useTaskActions(1);

			const result = await actions.handleComplete(mockItem);

			expect(result).toBe(false);
		});
	});

	describe('dialog controls', () => {
		it('should open and close create dialog', () => {
			const actions = useTaskActions(1);

			actions.openCreate();
			expect(actions.createDialogOpen.value).toBe(true);

			actions.closeCreate();
			expect(actions.createDialogOpen.value).toBe(false);
		});

		it('should open and close edit dialog', () => {
			const actions = useTaskActions(1);

			actions.openDelete(mockItem);
			expect(actions.deleteDialogOpen.value).toBe(true);

			actions.closeDelete();
			expect(actions.deleteDialogOpen.value).toBe(false);
		});

		it('should open and close delete dialog', () => {
			const actions = useTaskActions(1);

			actions.openDelete(mockItem);
			expect(actions.deleteDialogOpen.value).toBe(true);
			expect(actions.selectedItem).toBe(mockItem);

			actions.closeDelete();
			expect(actions.deleteDialogOpen.value).toBe(false);
		});
	});
});
