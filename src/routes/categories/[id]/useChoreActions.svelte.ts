import type { RecurringConfig } from '$lib/schemas/items';
import { useCrudDialogs } from '$lib/composables/useCrudDialogs.svelte';
import { createResource, updateResource, deleteResource, fetchResource } from '$lib/utils/api';
import { SvelteDate } from 'svelte/reactivity';

type Item = {
	id: number;
	assigned_to_user_id?: number | null;
	is_archived: boolean;
	recurring_config?: RecurringConfig | null;
	next_show_date?: string | null;
	values: Record<string, string>;
};

type ChoreFormData = {
	assigned_to_user_id?: number | null;
	recurring_config: RecurringConfig;
	values: Record<string, string>;
};

export function useChoreActions(categoryId: number | (() => number)) {
	const dialogs = useCrudDialogs<Item>();

	const getCategoryId = () => (typeof categoryId === 'function' ? categoryId() : categoryId);

	async function handleCreate(formData: ChoreFormData) {
		const result = await createResource(`/api/categories/${getCategoryId()}/items`, formData, {
			successMessage: 'Chore created successfully',
			errorMessage: 'Failed to create chore'
		});

		if (result.success) {
			dialogs.closeCreate();
		}
	}

	async function handleEdit(item: Item) {
		const result = await fetchResource<{ item: Item }>(`/api/items/${item.id}`, {
			errorMessage: 'Failed to load chore'
		});

		if (result.success && result.data) {
			dialogs.openEdit(result.data.item);
		}
	}

	async function handleUpdate(formData: ChoreFormData) {
		if (!dialogs.selectedItem) return;

		const result = await updateResource(`/api/items/${dialogs.selectedItem.id}`, formData, {
			successMessage: 'Chore updated successfully',
			errorMessage: 'Failed to update chore'
		});

		if (result.success) {
			dialogs.closeEdit();
		}
	}

	async function confirmDelete() {
		if (!dialogs.selectedItem) return;

		const result = await deleteResource(`/api/items/${dialogs.selectedItem.id}`, {
			successMessage: 'Chore deleted successfully',
			errorMessage: 'Failed to delete chore'
		});

		if (result.success) {
			dialogs.closeDelete();
		}
	}

	async function handleComplete(item: Item) {
		const nextDate = item.next_show_date
			? new SvelteDate(item.next_show_date).toLocaleDateString()
			: 'soon';
		await createResource(
			`/api/items/${item.id}/complete`,
			{},
			{
				successMessage: item.recurring_config
					? `Chore completed. Next occurrence scheduled for ${nextDate}.`
					: 'Chore completed',
				errorMessage: 'Failed to complete chore'
			}
		);
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
