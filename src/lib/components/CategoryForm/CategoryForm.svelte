<script lang="ts">
	import type { Category, Field } from '$lib/schemas';
	import { Button } from '$lib/components/ui/Button';
	import { Separator } from '$lib/components/ui/Separator';
	import CategoryBasicInfo from './CategoryBasicInfo.svelte';
	import CategoryFieldsSection from './CategoryFieldsSection.svelte';
	import { useCategoryFormState, type CategoryFormData } from './useCategoryFormState.svelte';

	type CategoryWithFields = Category & { fields?: Field[] };

	type Props = {
		mode: 'create' | 'edit';
		initialData?: CategoryWithFields;
		onSubmit: (data: CategoryFormData) => Promise<void>;
		onCancel: () => void;
	};

	let { mode, initialData, onSubmit, onCancel }: Props = $props();

	const state = useCategoryFormState();

	$effect(() => {
		if (initialData) {
			state.loadData(initialData);
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!state.validate()) {
			return;
		}

		state.loading = true;
		try {
			await onSubmit(state.getFormData());
		} finally {
			state.loading = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6">
	<CategoryBasicInfo
		name={state.name}
		templateType={state.templateType}
		icon={state.icon}
		color={state.color}
		isPrivate={state.isPrivate}
		{mode}
		loading={state.loading}
		errors={state.errors}
		onNameChange={(v) => (state.name = v)}
		onTemplateTypeChange={(v) => (state.templateType = v)}
		onIconChange={(v) => (state.icon = v)}
		onColorChange={(v) => (state.color = v)}
		onIsPrivateChange={(v) => (state.isPrivate = v)}
	/>

	<Separator />

	<CategoryFieldsSection
		fields={state.fields}
		loading={state.loading}
		errors={state.errors}
		onAddField={state.addField}
		onRemoveField={state.removeField}
		onUpdateField={state.updateField}
	/>

	<div class="flex justify-end gap-2">
		<Button type="button" variant="outline" onclick={onCancel} disabled={state.loading}>
			Cancel
		</Button>
		<Button type="submit" disabled={state.loading}>
			{state.loading ? 'Saving...' : mode === 'create' ? 'Create Category' : 'Update Category'}
		</Button>
	</div>
</form>
