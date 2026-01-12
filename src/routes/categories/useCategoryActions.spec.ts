import { describe, it, expect } from 'vitest';
import { useCategoryActions } from './useCategoryActions.svelte';

describe('useCategoryActions (sharing)', () => {
	it('opens and closes share dialog', () => {
		const actions = useCategoryActions();

		expect(actions.shareDialogOpen.value).toBe(false);
		expect(actions.shareCategory).toBeNull();

		actions.openShare({
			id: 1,
			user_id: 1,
			name: 'Work',
			template_type: 'task',
			icon: null,
			color: null,
			is_private: true,
			created_at: 'now',
			updated_at: 'now'
		});

		expect(actions.shareDialogOpen.value).toBe(true);
		expect(actions.shareCategory?.id).toBe(1);

		actions.closeShare();
		expect(actions.shareDialogOpen.value).toBe(false);
		expect(actions.shareCategory).toBeNull();
	});
});
