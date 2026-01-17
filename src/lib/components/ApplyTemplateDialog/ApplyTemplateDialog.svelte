<script lang="ts">
	import * as Dialog from '$lib/components/ui/Dialog';
	import { Button } from '$lib/components/ui/Button';
	import { Input } from '$lib/components/ui/Input';
	import { Label } from '$lib/components/ui/Label';
	import type { Template } from '$lib/schemas';
	import { getDefaultCategoryName } from '$lib/utils/templates';

	type Props = {
		open: boolean;
		template: Template | null;
		loading?: boolean;
		onApply: (name: string) => Promise<void>;
		onCancel: () => void;
	};

	let { open = $bindable(false), template, loading = false, onApply, onCancel }: Props = $props();
	let categoryName = $state('');

	$effect(() => {
		if (template) {
			categoryName = getDefaultCategoryName(template);
		}
	});

	async function handleSubmit() {
		if (categoryName.trim()) {
			await onApply(categoryName);
		}
	}
</script>

<Dialog.Dialog bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create from Template</Dialog.Title>
			<Dialog.Description>
				{#if template}
					Customize the category name for your {template.name} template
				{:else}
					Create a new category from a template
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="name">Category Name</Label>
				<Input
					id="name"
					bind:value={categoryName}
					placeholder="Enter category name"
					disabled={loading}
				/>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={onCancel} disabled={loading}>Cancel</Button>
			<Button onclick={handleSubmit} disabled={loading || !categoryName.trim()}>
				{loading ? 'Creating...' : 'Create Category'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Dialog>
