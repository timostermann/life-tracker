import type { RecurringConfig } from '$lib/schemas/items';
import { useCrudDialogs } from '$lib/composables/useCrudDialogs.svelte';
import { createResource, updateResource, deleteResource, fetchResource } from '$lib/utils/api';

type Item = {
	id: number;
	priority?: 'urgent' | 'high' | 'medium' | 'low' | null;
	deadline?: string | null;
	time_estimate?: number | null;
	assigned_to_user_id?: number | null;
	is_archived: boolean;
	recurring_config?: RecurringConfig | null;
	values: Record<string, string>;
};

type TaskFormData = {
	priority?: 'urgent' | 'high' | 'medium' | 'low' | null;
	deadline?: string | null;
	time_estimate?: number | null;
	assigned_to_user_id?: number | null;
	recurring_config?: RecurringConfig | null;
	values: Record<string, string>;
};

export function useTaskActions(categoryId: number | (() => number)) {
	const dialogs = useCrudDialogs<Item>();

	// Access categoryId reactively - handle both direct value and getter function
	const getCategoryId = () => (typeof categoryId === 'function' ? categoryId() : categoryId);

	async function handleCreate(formData: TaskFormData) {
		const result = await createResource(`/api/categories/${getCategoryId()}/items`, formData, {
			successMessage: 'Task created successfully',
			errorMessage: 'Failed to create task'
		});

		if (result.success) {
			dialogs.closeCreate();
		}
	}

	async function handleEdit(item: Item) {
		const result = await fetchResource<{ item: Item }>(`/api/items/${item.id}`, {
			errorMessage: 'Failed to load task'
		});

		if (result.success && result.data) {
			dialogs.openEdit(result.data.item);
		}
	}

	async function handleUpdate(formData: TaskFormData) {
		if (!dialogs.selectedItem) return;

		const result = await updateResource(`/api/items/${dialogs.selectedItem.id}`, formData, {
			successMessage: 'Task updated successfully',
			errorMessage: 'Failed to update task'
		});

		if (result.success) {
			dialogs.closeEdit();
		}
	}

	async function confirmDelete() {
		if (!dialogs.selectedItem) return;

		const result = await deleteResource(`/api/items/${dialogs.selectedItem.id}`, {
			successMessage: 'Task deleted successfully',
			errorMessage: 'Failed to delete task'
		});

		if (result.success) {
			dialogs.closeDelete();
		}
	}

	async function handleComplete(item: Item) {
		const result = await createResource(
			`/api/items/${item.id}/complete`,
			{},
			{
				successMessage: item.recurring_config
					? 'Task completed. Next occurrence created.'
					: 'Task completed',
				errorMessage: 'Failed to complete task'
			}
		);

		return result.success;
	}

	return {
		createDialogOpen: dialogs.createDialogOpen,
		editDialogOpen: dialogs.editDialogOpen,
		deleteDialogOpen: dialogs.deleteDialogOpen,
		get selectedItem() {
			return dialogs.selectedItem;
		},
		openCreate: dialogs.openCreate,
		openEdit: handleEdit,
		openDelete: dialogs.openDelete,
		closeCreate: dialogs.closeCreate,
		closeEdit: dialogs.closeEdit,
		closeDelete: dialogs.closeDelete,
		handleCreate,
		handleEdit: handleUpdate,
		handleDelete: confirmDelete,
		handleComplete
	};
}
