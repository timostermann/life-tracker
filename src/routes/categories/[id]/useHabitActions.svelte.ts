import { useCrudDialogs } from '$lib/composables/useCrudDialogs.svelte';
import { createResource, updateResource, deleteResource, fetchResource } from '$lib/utils/api';
import type { HabitEntryInput } from '$lib/schemas/habits';
import type { HabitEntry } from '$lib/schemas/db';

type Item = {
	id: number;
	values: Record<string, string>;
};

type HabitFormData = {
	values: Record<string, string>;
};

export function useHabitActions(categoryId: number | (() => number)) {
	const dialogs = useCrudDialogs<Item>();
	const entryDialog = useCrudDialogs<HabitEntry>();

	let logDialogOpen = $state(false);
	let selectedLogItem = $state<{ item: Item; date?: string } | null>(null);

	const getCategoryId = () => (typeof categoryId === 'function' ? categoryId() : categoryId);

	async function handleCreate(formData: HabitFormData) {
		const result = await createResource(`/api/categories/${getCategoryId()}/items`, formData, {
			successMessage: 'Habit created successfully',
			errorMessage: 'Failed to create habit'
		});

		if (result.success) {
			dialogs.closeCreate();
		}
	}

	async function handleEdit(item: Item) {
		const result = await fetchResource<{ item: Item }>(`/api/items/${item.id}`, {
			errorMessage: 'Failed to load habit'
		});

		if (result.success && result.data) {
			dialogs.openEdit(result.data.item);
		}
	}

	async function handleUpdate(formData: HabitFormData) {
		if (!dialogs.selectedItem) return;

		const result = await updateResource(`/api/items/${dialogs.selectedItem.id}`, formData, {
			successMessage: 'Habit updated successfully',
			errorMessage: 'Failed to update habit'
		});

		if (result.success) {
			dialogs.closeEdit();
		}
	}

	async function confirmDelete() {
		if (!dialogs.selectedItem) return;

		const result = await deleteResource(`/api/items/${dialogs.selectedItem.id}`, {
			successMessage: 'Habit deleted successfully',
			errorMessage: 'Failed to delete habit'
		});

		if (result.success) {
			dialogs.closeDelete();
		}
	}

	function openLog(item: Item, date?: string) {
		selectedLogItem = { item, date };
		logDialogOpen = true;
	}

	function closeLog() {
		logDialogOpen = false;
		selectedLogItem = null;
	}

	async function handleLogEntry(entryData: HabitEntryInput) {
		if (!selectedLogItem) return;

		const result = await createResource(
			`/api/habits/${selectedLogItem.item.id}/entries`,
			entryData,
			{
				successMessage: 'Entry logged successfully',
				errorMessage: 'Failed to log entry'
			}
		);

		if (result.success) {
			closeLog();
		}
	}

	function openEditEntry(entry: HabitEntry) {
		entryDialog.openEdit(entry);
	}

	function closeEditEntry() {
		entryDialog.closeEdit();
	}

	async function handleUpdateEntry(entryData: HabitEntryInput) {
		if (!entryDialog.selectedItem) return;
		const entry = entryDialog.selectedItem;

		const result = await updateResource(
			`/api/habits/${entry.item_id}/entries/${entry.logged_date}`,
			entryData,
			{
				successMessage: 'Entry updated successfully',
				errorMessage: 'Failed to update entry'
			}
		);

		if (result.success) {
			entryDialog.closeEdit();
		}
	}

	function openDeleteEntry(entry: HabitEntry) {
		entryDialog.openDelete(entry);
	}

	function closeDeleteEntry() {
		entryDialog.closeDelete();
	}

	async function confirmDeleteEntry() {
		if (!entryDialog.selectedItem) return;
		const entry = entryDialog.selectedItem;

		const result = await deleteResource(
			`/api/habits/${entry.item_id}/entries/${entry.logged_date}`,
			{
				successMessage: 'Entry deleted successfully',
				errorMessage: 'Failed to delete entry'
			}
		);

		if (result.success) {
			entryDialog.closeDelete();
		}
	}

	return {
		createDialogOpen: dialogs.createDialogOpen,
		editDialogOpen: dialogs.editDialogOpen,
		deleteDialogOpen: dialogs.deleteDialogOpen,
		logDialogOpen: {
			get value() {
				return logDialogOpen;
			},
			set value(v: boolean) {
				logDialogOpen = v;
			}
		},
		entryEditDialogOpen: entryDialog.editDialogOpen,
		entryDeleteDialogOpen: entryDialog.deleteDialogOpen,
		get selectedItem() {
			return dialogs.selectedItem;
		},
		get selectedLogItem() {
			return selectedLogItem;
		},
		get selectedEntry() {
			return entryDialog.selectedItem;
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
		openLog,
		closeLog,
		handleLogEntry,
		openEditEntry,
		closeEditEntry,
		handleUpdateEntry,
		openDeleteEntry,
		closeDeleteEntry,
		handleDeleteEntry: confirmDeleteEntry
	};
}
