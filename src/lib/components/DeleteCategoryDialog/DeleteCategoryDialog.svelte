<script lang="ts">
	import * as Dialog from '$lib/components/ui/Dialog';
	import { Button } from '$lib/components/ui/Button';

	type Props = {
		open?: boolean;
		categoryName: string;
		onConfirm: () => void;
		onCancel: () => void;
	};

	let { open = $bindable(false), categoryName, onConfirm, onCancel }: Props = $props();
</script>

<Dialog.Dialog bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Category?</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete <strong>{categoryName}</strong>?
				<br />
				This will permanently delete the category and all items within it. This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={onCancel}>Cancel</Button>
			<Button variant="destructive" onclick={onConfirm}>Delete</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Dialog>
