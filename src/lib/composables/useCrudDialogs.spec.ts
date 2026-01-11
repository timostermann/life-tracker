import { describe, it, expect } from 'vitest';
import { useCrudDialogs } from './useCrudDialogs.svelte';

describe('useCrudDialogs', () => {
	it('should initialize with all dialogs closed and no selected item', () => {
		const dialogs = useCrudDialogs<{ id: number; name: string }>();

		expect(dialogs.createDialogOpen.value).toBe(false);
		expect(dialogs.editDialogOpen.value).toBe(false);
		expect(dialogs.deleteDialogOpen.value).toBe(false);
		expect(dialogs.selectedItem).toBeNull();
	});

	it('should open and close create dialog', () => {
		const dialogs = useCrudDialogs<{ id: number; name: string }>();

		dialogs.openCreate();
		expect(dialogs.createDialogOpen.value).toBe(true);

		dialogs.closeCreate();
		expect(dialogs.createDialogOpen.value).toBe(false);
	});

	it('should open edit dialog with selected item', () => {
		const dialogs = useCrudDialogs<{ id: number; name: string }>();
		const item = { id: 1, name: 'Test Item' };

		dialogs.openEdit(item);

		expect(dialogs.editDialogOpen.value).toBe(true);
		expect(dialogs.selectedItem).toBe(item);
	});

	it('should close edit dialog and clear selected item', () => {
		const dialogs = useCrudDialogs<{ id: number; name: string }>();
		const item = { id: 1, name: 'Test Item' };

		dialogs.openEdit(item);
		dialogs.closeEdit();

		expect(dialogs.editDialogOpen.value).toBe(false);
		expect(dialogs.selectedItem).toBeNull();
	});

	it('should open delete dialog with selected item', () => {
		const dialogs = useCrudDialogs<{ id: number; name: string }>();
		const item = { id: 1, name: 'Test Item' };

		dialogs.openDelete(item);

		expect(dialogs.deleteDialogOpen.value).toBe(true);
		expect(dialogs.selectedItem).toBe(item);
	});

	it('should close delete dialog and clear selected item', () => {
		const dialogs = useCrudDialogs<{ id: number; name: string }>();
		const item = { id: 1, name: 'Test Item' };

		dialogs.openDelete(item);
		dialogs.closeDelete();

		expect(dialogs.deleteDialogOpen.value).toBe(false);
		expect(dialogs.selectedItem).toBeNull();
	});

	it('should allow setting dialog open state via value setter', () => {
		const dialogs = useCrudDialogs<{ id: number; name: string }>();

		dialogs.createDialogOpen.value = true;
		expect(dialogs.createDialogOpen.value).toBe(true);

		dialogs.editDialogOpen.value = true;
		expect(dialogs.editDialogOpen.value).toBe(true);

		dialogs.deleteDialogOpen.value = true;
		expect(dialogs.deleteDialogOpen.value).toBe(true);
	});

	it('should handle multiple operations independently', () => {
		const dialogs = useCrudDialogs<{ id: number; name: string }>();
		const item1 = { id: 1, name: 'Item 1' };
		const item2 = { id: 2, name: 'Item 2' };

		dialogs.openEdit(item1);
		expect(dialogs.selectedItem).toBe(item1);

		dialogs.closeEdit();
		expect(dialogs.selectedItem).toBeNull();

		dialogs.openDelete(item2);
		expect(dialogs.selectedItem).toBe(item2);
		expect(dialogs.deleteDialogOpen.value).toBe(true);
		expect(dialogs.editDialogOpen.value).toBe(false);
	});
});
