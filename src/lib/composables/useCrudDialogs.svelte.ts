export function useCrudDialogs<T>() {
	let createDialogOpen = $state(false);
	let editDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let selectedItem = $state<T | null>(null);

	function openCreate() {
		createDialogOpen = true;
	}

	function closeCreate() {
		createDialogOpen = false;
	}

	function openEdit(item: T) {
		selectedItem = item;
		editDialogOpen = true;
	}

	function closeEdit() {
		editDialogOpen = false;
		selectedItem = null;
	}

	function openDelete(item: T) {
		selectedItem = item;
		deleteDialogOpen = true;
	}

	function closeDelete() {
		deleteDialogOpen = false;
		selectedItem = null;
	}

	return {
		createDialogOpen: {
			get value() {
				return createDialogOpen;
			},
			set value(v: boolean) {
				createDialogOpen = v;
			}
		},
		editDialogOpen: {
			get value() {
				return editDialogOpen;
			},
			set value(v: boolean) {
				editDialogOpen = v;
			}
		},
		deleteDialogOpen: {
			get value() {
				return deleteDialogOpen;
			},
			set value(v: boolean) {
				deleteDialogOpen = v;
			}
		},
		get selectedItem() {
			return selectedItem;
		},
		openCreate,
		closeCreate,
		openEdit,
		closeEdit,
		openDelete,
		closeDelete
	};
}
