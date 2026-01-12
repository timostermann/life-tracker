import type { Category, Field } from '$lib/schemas';
import { useCrudDialogs } from '$lib/composables/useCrudDialogs.svelte';
import { createResource, updateResource, deleteResource, fetchResource } from '$lib/utils/api';

type CategoryWithFields = Category & { fields?: Field[] };

type CategoryFormData = {
	name: string;
	template_type: 'task' | 'chore' | 'habit';
	icon?: string;
	color?: string;
	is_private: boolean;
	fields: Array<{
		name: string;
		field_type: 'text' | 'number' | 'date' | 'boolean' | 'select';
		options?: string;
		field_order: number;
	}>;
};

export function useCategoryActions() {
	const dialogs = useCrudDialogs<CategoryWithFields>();
	let shareDialogOpen = $state(false);
	let shareCategory = $state<Category | null>(null);

	async function handleCreate(formData: CategoryFormData) {
		const result = await createResource('/api/categories', formData, {
			successMessage: 'Category created successfully',
			errorMessage: 'Failed to create category'
		});

		if (result.success) {
			dialogs.closeCreate();
		}
	}

	async function handleEdit(category: Category) {
		const result = await fetchResource<{ category: CategoryWithFields }>(
			`/api/categories/${category.id}`,
			{
				errorMessage: 'Failed to load category'
			}
		);

		if (result.success && result.data) {
			dialogs.openEdit(result.data.category);
		}
	}

	async function handleUpdate(formData: CategoryFormData) {
		if (!dialogs.selectedItem) return;

		const result = await updateResource(`/api/categories/${dialogs.selectedItem.id}`, formData, {
			successMessage: 'Category updated successfully',
			errorMessage: 'Failed to update category'
		});

		if (result.success) {
			dialogs.closeEdit();
		}
	}

	async function confirmDelete() {
		if (!dialogs.selectedItem) return;

		const result = await deleteResource(`/api/categories/${dialogs.selectedItem.id}`, {
			successMessage: 'Category deleted successfully',
			errorMessage: 'Failed to delete category'
		});

		if (result.success) {
			dialogs.closeDelete();
		}
	}

	return {
		createDialogOpen: dialogs.createDialogOpen,
		editDialogOpen: dialogs.editDialogOpen,
		deleteDialogOpen: dialogs.deleteDialogOpen,
		get selectedCategory() {
			return dialogs.selectedItem;
		},
		get shareCategory() {
			return shareCategory;
		},
		shareDialogOpen: {
			get value() {
				return shareDialogOpen;
			},
			set value(v: boolean) {
				shareDialogOpen = v;
			}
		},
		openShare: (category: Category) => {
			shareCategory = category;
			shareDialogOpen = true;
		},
		closeShare: () => {
			shareDialogOpen = false;
			shareCategory = null;
		},
		openCreate: dialogs.openCreate,
		handleCreate,
		handleEdit,
		handleUpdate,
		handleDeleteClick: dialogs.openDelete,
		confirmDelete,
		cancelDelete: dialogs.closeDelete,
		cancelCreate: dialogs.closeCreate,
		cancelEdit: dialogs.closeEdit
	};
}
