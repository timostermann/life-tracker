<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/Button';
	import * as Dialog from '$lib/components/ui/Dialog';
	import * as Tabs from '$lib/components/ui/Tabs';
	import { TaskList } from '$lib/components/TaskList';
	import { TaskForm } from '$lib/components/TaskForm';
	import { ChoreList } from '$lib/components/ChoreList';
	import { ChoreForm } from '$lib/components/ChoreForm';
	import { ChoreSchedule } from '$lib/components/ChoreSchedule';
	import { Plus, ArrowLeft } from 'lucide-svelte';
	import { useTaskActions } from './useTaskActions.svelte';
	import { useChoreActions } from './useChoreActions.svelte';
	import { resolve } from '$app/paths';

	let { data }: { data: PageData } = $props();

	const isChore = $derived(data.category.template_type === 'chore');
	const isTask = $derived(data.category.template_type === 'task');

	const getCategoryId = () => data.category.id;
	const taskActions = $derived.by(() => (isTask ? useTaskActions(getCategoryId) : null));
	const choreActions = $derived.by(() => (isChore ? useChoreActions(getCategoryId) : null));

	let showArchived = $state(false);
	let activeTab = $state<'active' | 'schedule' | 'archived'>('active');
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
			{#if choreActions}
				<Button onclick={choreActions.openCreate}>
					<Plus class="mr-2 size-4" />
					New Chore
				</Button>
			{:else if taskActions}
				<Button onclick={taskActions.openCreate}>
					<Plus class="mr-2 size-4" />
					New Task
				</Button>
			{/if}
		</div>
	</div>

	{#if isChore}
		<Tabs.Root value={activeTab} onValueChange={(v) => v && (activeTab = v as typeof activeTab)}>
			<Tabs.List>
				<Tabs.Trigger value="active">Active Chores</Tabs.Trigger>
				<Tabs.Trigger value="schedule">Schedule</Tabs.Trigger>
				<Tabs.Trigger value="archived">Archived</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="active">
				{#if choreActions}
					<ChoreList
						items={data.items}
						onEdit={choreActions.openEdit}
						onDelete={choreActions.openDelete}
						onComplete={choreActions.handleComplete}
						categoryColor={data.category.color ?? undefined}
					/>
				{/if}
			</Tabs.Content>
			<Tabs.Content value="schedule">
				{#if choreActions}
					<ChoreSchedule
						items={data.upcomingChores || []}
						onComplete={choreActions.handleComplete}
						categoryColor={data.category.color ?? undefined}
					/>
				{/if}
			</Tabs.Content>
			<Tabs.Content value="archived">
				{#if choreActions}
					<ChoreList
						items={data.archivedItems}
						onEdit={choreActions.openEdit}
						onDelete={choreActions.openDelete}
						categoryColor={data.category.color ?? undefined}
					/>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	{:else if isTask && taskActions}
		<TaskList
			items={showArchived ? data.archivedItems : data.items}
			onEdit={taskActions.openEdit}
			onDelete={taskActions.openDelete}
			onComplete={taskActions.handleComplete}
			categoryColor={data.category.color ?? undefined}
		/>
	{/if}

	{#if isChore && choreActions}
		<Dialog.Dialog bind:open={choreActions.createDialogOpen.value}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Create Chore</Dialog.Title>
				</Dialog.Header>
				<ChoreForm
					fields={data.fields}
					onSubmit={choreActions.handleCreate}
					onCancel={choreActions.closeCreate}
				/>
			</Dialog.Content>
		</Dialog.Dialog>

		<Dialog.Dialog bind:open={choreActions.editDialogOpen.value}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Edit Chore</Dialog.Title>
				</Dialog.Header>
				{#if choreActions.selectedItem}
					<ChoreForm
						fields={data.fields}
						initialData={choreActions.selectedItem}
						onSubmit={choreActions.handleEdit}
						onCancel={choreActions.closeEdit}
					/>
				{/if}
			</Dialog.Content>
		</Dialog.Dialog>

		<Dialog.Dialog bind:open={choreActions.deleteDialogOpen.value}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Delete Chore</Dialog.Title>
					<Dialog.Description>
						Are you sure you want to delete this chore? This action cannot be undone.
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button variant="outline" onclick={choreActions.closeDelete}>Cancel</Button>
					<Button variant="destructive" onclick={choreActions.handleDelete}>Delete</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Dialog>
	{:else if isTask && taskActions}
		<Dialog.Dialog bind:open={taskActions.createDialogOpen.value}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Create Task</Dialog.Title>
				</Dialog.Header>
				<TaskForm
					fields={data.fields}
					onSubmit={taskActions.handleCreate}
					onCancel={taskActions.closeCreate}
				/>
			</Dialog.Content>
		</Dialog.Dialog>

		<Dialog.Dialog bind:open={taskActions.editDialogOpen.value}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Edit Task</Dialog.Title>
				</Dialog.Header>
				{#if taskActions.selectedItem}
					<TaskForm
						fields={data.fields}
						initialData={taskActions.selectedItem}
						onSubmit={taskActions.handleEdit}
						onCancel={taskActions.closeEdit}
					/>
				{/if}
			</Dialog.Content>
		</Dialog.Dialog>

		<Dialog.Dialog bind:open={taskActions.deleteDialogOpen.value}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Delete Task</Dialog.Title>
					<Dialog.Description>
						Are you sure you want to delete this task? This action cannot be undone.
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button variant="outline" onclick={taskActions.closeDelete}>Cancel</Button>
					<Button variant="destructive" onclick={taskActions.handleDelete}>Delete</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Dialog>

		<div class="mt-8 flex justify-center">
			<Button variant="outline" onclick={() => (showArchived = !showArchived)}>
				{showArchived ? 'Show Active Tasks' : 'Show Archived Tasks'}
			</Button>
		</div>
	{/if}
</div>
