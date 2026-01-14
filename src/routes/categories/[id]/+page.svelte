<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/Button';
	import * as Dialog from '$lib/components/ui/Dialog';
	import { TaskList } from '$lib/components/TaskList';
	import { TaskForm } from '$lib/components/TaskForm';
	import { Plus, ArrowLeft } from 'lucide-svelte';
	import { useTaskActions } from './useTaskActions.svelte';
	import { resolve } from '$app/paths';

	let { data }: { data: PageData } = $props();

	// Create actions once - page remounts on navigation
	// Pass getter function to access prop reactively inside closures
	const actions = useTaskActions(() => data.category.id);
	let showArchived = $state(false);
</script>

<svelte:head>
	<title>{data.category.name} - Life Tracker</title>
</svelte:head>

<div class="container mx-auto py-8">
	<div class="mb-8">
		<a href={resolve('/categories')} class="mb-4 inline-block">
			<Button variant="ghost">
				<ArrowLeft class="mr-2 size-4" />
				Back to Categories
			</Button>
		</a>

		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<h1 class="text-3xl font-bold">{data.category.name}</h1>
			</div>
			<Button onclick={actions.openCreate}>
				<Plus class="mr-2 size-4" />
				New Task
			</Button>
		</div>
	</div>

	<TaskList
		items={showArchived ? data.archivedItems : data.items}
		onEdit={actions.openEdit}
		onDelete={actions.openDelete}
		onComplete={actions.handleComplete}
	/>

	<Dialog.Dialog bind:open={actions.createDialogOpen.value}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Create Task</Dialog.Title>
			</Dialog.Header>
			<TaskForm
				fields={data.fields}
				onSubmit={actions.handleCreate}
				onCancel={actions.closeCreate}
			/>
		</Dialog.Content>
	</Dialog.Dialog>

	<Dialog.Dialog bind:open={actions.editDialogOpen.value}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Edit Task</Dialog.Title>
			</Dialog.Header>
			{#if actions.selectedItem}
				<TaskForm
					fields={data.fields}
					initialData={actions.selectedItem}
					onSubmit={actions.handleEdit}
					onCancel={actions.closeEdit}
				/>
			{/if}
		</Dialog.Content>
	</Dialog.Dialog>

	<Dialog.Dialog bind:open={actions.deleteDialogOpen.value}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Delete Task</Dialog.Title>
				<Dialog.Description>
					Are you sure you want to delete this task? This action cannot be undone.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="outline" onclick={actions.closeDelete}>Cancel</Button>
				<Button variant="destructive" onclick={actions.handleDelete}>Delete</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Dialog>

	<div class="mt-8 flex justify-center">
		<Button variant="outline" onclick={() => (showArchived = !showArchived)}>
			{showArchived ? 'Show Active Tasks' : 'Show Archived Tasks'}
		</Button>
	</div>
</div>
