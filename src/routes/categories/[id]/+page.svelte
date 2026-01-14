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
	import { HabitList } from '$lib/components/HabitList';
	import { HabitForm } from '$lib/components/HabitForm';
	import { HabitLogForm } from '$lib/components/HabitLogForm';
	import { HabitCalendar } from '$lib/components/HabitCalendar';
	import { HabitStats } from '$lib/components/HabitStats';
	import { HabitHistory } from '$lib/components/HabitHistory';
	import * as Select from '$lib/components/ui/Select';
	import { Label } from '$lib/components/ui/Label';
	import { Plus, ArrowLeft } from 'lucide-svelte';
	import { useTaskActions } from './useTaskActions.svelte';
	import { useChoreActions } from './useChoreActions.svelte';
	import { useHabitActions } from './useHabitActions.svelte';
	import { resolve } from '$app/paths';

	let { data }: { data: PageData } = $props();

	const isChore = $derived(data.category.template_type === 'chore');
	const isTask = $derived(data.category.template_type === 'task');
	const isHabit = $derived(data.category.template_type === 'habit');

	const getCategoryId = () => data.category.id;
	const taskActions = $derived.by(() => (isTask ? useTaskActions(getCategoryId) : null));
	const choreActions = $derived.by(() => (isChore ? useChoreActions(getCategoryId) : null));
	const habitActions = $derived.by(() => (isHabit ? useHabitActions(getCategoryId) : null));

	let showArchived = $state(false);
	let activeTab = $state<'active' | 'schedule' | 'archived'>('active');
	let habitTab = $state<'active' | 'stats' | 'calendar' | 'history'>('active');
	let selectedHabitId = $state<number | null>(null);

	const habitStatsMap = $derived.by(() => {
		const map: Record<number, (typeof data.habitEntries)[number]['stats']> = {};
		for (const [itemId, { stats }] of Object.entries(data.habitEntries || {})) {
			map[Number(itemId)] = stats;
		}
		return map;
	});

	const habitEntriesMap = $derived.by(() => {
		const map: Record<number, (typeof data.habitEntries)[number]['entries']> = {};
		for (const [itemId, { entries }] of Object.entries(data.habitEntries || {})) {
			map[Number(itemId)] = entries;
		}
		return map;
	});

	const selectedHabitData = $derived.by(() => {
		if (!selectedHabitId) return null;
		return data.habitEntries?.[selectedHabitId] ?? null;
	});
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
			{:else if habitActions}
				<Button onclick={habitActions.openCreate}>
					<Plus class="mr-2 size-4" />
					New Habit
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
	{:else if isHabit && habitActions}
		<Tabs.Root value={habitTab} onValueChange={(v) => v && (habitTab = v as typeof habitTab)}>
			<Tabs.List>
				<Tabs.Trigger value="active">Active Habits</Tabs.Trigger>
				<Tabs.Trigger value="stats">Stats</Tabs.Trigger>
				<Tabs.Trigger value="calendar">Calendar</Tabs.Trigger>
				<Tabs.Trigger value="history">History</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="active">
				<HabitList
					items={data.items}
					habitStats={habitStatsMap}
					habitEntries={habitEntriesMap}
					onLog={(item, date) => {
						selectedHabitId = item.id;
						habitActions.openLog(item, date);
					}}
					onEdit={(item) => {
						selectedHabitId = item.id;
						habitActions.openEdit(item);
					}}
					onDelete={(item) => {
						selectedHabitId = item.id;
						habitActions.openDelete(item);
					}}
					categoryColor={data.category.color ?? undefined}
				/>
			</Tabs.Content>
			<Tabs.Content value="stats">
				{#if data.items.length === 0}
					<p class="py-8 text-center text-muted-foreground">Create a habit to view its stats</p>
				{:else}
					{#if !selectedHabitId}
						{(selectedHabitId = data.items[0].id)}
					{/if}
					<div class="mb-4">
						<Label for="habit-select-stats">Select Habit</Label>
						<Select.Root
							type="single"
							value={selectedHabitId ? String(selectedHabitId) : undefined}
							onValueChange={(v) => {
								if (v) selectedHabitId = Number(v);
							}}
						>
							<Select.Trigger id="habit-select-stats" class="w-full sm:w-[300px]">
								{data.items.find((i) => i.id === selectedHabitId)?.values
									? Object.values(data.items.find((i) => i.id === selectedHabitId)!.values)[0] ||
										'Select a habit'
									: 'Select a habit'}
							</Select.Trigger>
							<Select.Content>
								{#each data.items as item (item.id)}
									<Select.Item value={String(item.id)}>
										{Object.values(item.values)[0] || 'Untitled'}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					{#if selectedHabitId && selectedHabitData}
						<HabitStats stats={selectedHabitData.stats} />
					{/if}
				{/if}
			</Tabs.Content>
			<Tabs.Content value="calendar">
				{#if data.items.length === 0}
					<p class="py-8 text-center text-muted-foreground">Create a habit to view its calendar</p>
				{:else}
					{#if !selectedHabitId}
						{(selectedHabitId = data.items[0].id)}
					{/if}
					<div class="mb-4">
						<Label for="habit-select">Select Habit</Label>
						<Select.Root
							type="single"
							value={selectedHabitId ? String(selectedHabitId) : undefined}
							onValueChange={(v) => {
								if (v) selectedHabitId = Number(v);
							}}
						>
							<Select.Trigger id="habit-select" class="w-full sm:w-[300px]">
								{data.items.find((i) => i.id === selectedHabitId)?.values
									? Object.values(data.items.find((i) => i.id === selectedHabitId)!.values)[0] ||
										'Select a habit'
									: 'Select a habit'}
							</Select.Trigger>
							<Select.Content>
								{#each data.items as item (item.id)}
									<Select.Item value={String(item.id)}>
										{Object.values(item.values)[0] || 'Untitled'}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					{#if selectedHabitId && selectedHabitData}
						<HabitCalendar
							entries={selectedHabitData.entries}
							onDayClick={(date, entry) => {
								if (entry) {
									habitActions.openEditEntry(entry);
								} else {
									const item = data.items.find((i) => i.id === selectedHabitId);
									if (item) {
										habitActions.openLog(item, date);
									}
								}
							}}
						/>
					{/if}
				{/if}
			</Tabs.Content>
			<Tabs.Content value="history">
				{#if data.items.length === 0}
					<p class="py-8 text-center text-muted-foreground">Create a habit to view its history</p>
				{:else}
					{#if !selectedHabitId}
						{(selectedHabitId = data.items[0].id)}
					{/if}
					<div class="mb-4">
						<Label for="habit-select-history">Select Habit</Label>
						<Select.Root
							type="single"
							value={selectedHabitId ? String(selectedHabitId) : undefined}
							onValueChange={(v) => {
								if (v) selectedHabitId = Number(v);
							}}
						>
							<Select.Trigger id="habit-select-history" class="w-full sm:w-[300px]">
								{data.items.find((i) => i.id === selectedHabitId)?.values
									? Object.values(data.items.find((i) => i.id === selectedHabitId)!.values)[0] ||
										'Select a habit'
									: 'Select a habit'}
							</Select.Trigger>
							<Select.Content>
								{#each data.items as item (item.id)}
									<Select.Item value={String(item.id)}>
										{Object.values(item.values)[0] || 'Untitled'}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					{#if selectedHabitId && selectedHabitData}
						<HabitHistory
							entries={selectedHabitData.entries}
							onEdit={habitActions.openEditEntry}
							onDelete={habitActions.openDeleteEntry}
						/>
					{/if}
				{/if}
			</Tabs.Content>
		</Tabs.Root>
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
	{:else if isHabit && habitActions}
		<Dialog.Dialog bind:open={habitActions.createDialogOpen.value}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Create Habit</Dialog.Title>
				</Dialog.Header>
				<HabitForm
					fields={data.fields}
					onSubmit={habitActions.handleCreate}
					onCancel={habitActions.closeCreate}
				/>
			</Dialog.Content>
		</Dialog.Dialog>

		<Dialog.Dialog bind:open={habitActions.editDialogOpen.value}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Edit Habit</Dialog.Title>
				</Dialog.Header>
				{#if habitActions.selectedItem}
					<HabitForm
						fields={data.fields}
						initialData={habitActions.selectedItem}
						onSubmit={habitActions.handleEdit}
						onCancel={habitActions.closeEdit}
					/>
				{/if}
			</Dialog.Content>
		</Dialog.Dialog>

		<Dialog.Dialog bind:open={habitActions.deleteDialogOpen.value}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Delete Habit</Dialog.Title>
					<Dialog.Description>
						Are you sure you want to delete this habit? This action cannot be undone.
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button variant="outline" onclick={habitActions.closeDelete}>Cancel</Button>
					<Button variant="destructive" onclick={habitActions.handleDelete}>Delete</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Dialog>

		<Dialog.Dialog bind:open={habitActions.logDialogOpen.value}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Log Entry</Dialog.Title>
				</Dialog.Header>
				{#if habitActions.selectedLogItem}
					<HabitLogForm
						initialDate={habitActions.selectedLogItem.date}
						onSubmit={habitActions.handleLogEntry}
						onCancel={habitActions.closeLog}
					/>
				{/if}
			</Dialog.Content>
		</Dialog.Dialog>

		<Dialog.Dialog bind:open={habitActions.entryEditDialogOpen.value}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Edit Entry</Dialog.Title>
				</Dialog.Header>
				{#if habitActions.selectedEntry}
					<HabitLogForm
						initialDate={habitActions.selectedEntry.logged_date}
						initialData={{
							status: habitActions.selectedEntry.status,
							notes: habitActions.selectedEntry.notes
						}}
						onSubmit={habitActions.handleUpdateEntry}
						onCancel={habitActions.closeEditEntry}
					/>
				{/if}
			</Dialog.Content>
		</Dialog.Dialog>

		<Dialog.Dialog bind:open={habitActions.entryDeleteDialogOpen.value}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Delete Entry</Dialog.Title>
					<Dialog.Description>
						Are you sure you want to delete this entry? This action cannot be undone.
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Button variant="outline" onclick={habitActions.closeDeleteEntry}>Cancel</Button>
					<Button variant="destructive" onclick={habitActions.handleDeleteEntry}>Delete</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Dialog>
	{/if}
</div>
