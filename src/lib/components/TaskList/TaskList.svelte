<script lang="ts">
	import { Button } from '$lib/components/ui/Button';
	import PriorityBadge from '$lib/components/PriorityBadge/PriorityBadge.svelte';
	import AssigneeAvatar from '$lib/components/AssigneeAvatar/AssigneeAvatar.svelte';
	import * as Select from '$lib/components/ui/Select';
	import { Label } from '$lib/components/ui/Label';
	import { Checkbox } from '$lib/components/ui/Checkbox';
	import { CheckCircle, Pencil, Trash2 } from 'lucide-svelte';
	import type { RecurringConfig } from '$lib/schemas/items';
	import { formatRecurringConfig } from '$lib/utils/recurring';
	import { formatMinutes } from '$lib/utils/time';

	type Item = {
		id: number;
		priority?: 'urgent' | 'high' | 'medium' | 'low' | null;
		deadline?: string | null;
		time_estimate?: number | null;
		assigned_to_user_id?: number | null;
		is_archived: boolean;
		recurring_config?: RecurringConfig | null;
		values: Record<string, string>;
	};

	type Props = {
		items: Item[];
		onEdit?: (item: Item) => void;
		onDelete?: (item: Item) => void;
		onComplete?: (item: Item) => void;
		showArchived?: boolean;
		onToggleArchived?: (value: boolean) => void;
		categoryColor?: string;
	};

	let {
		items,
		onEdit,
		onDelete,
		onComplete,
		showArchived = false,
		onToggleArchived,
		categoryColor
	}: Props = $props();

	let priorityFilter = $state<string>('all');
	let assigneeFilter = $state<string>('all');

	let filteredItems = $derived.by(() => {
		let filtered = items;

		if (priorityFilter !== 'all') {
			filtered = filtered.filter((item) => item.priority === priorityFilter);
		}

		if (assigneeFilter !== 'all') {
			if (assigneeFilter === 'unassigned') {
				filtered = filtered.filter((item) => !item.assigned_to_user_id);
			} else {
				filtered = filtered.filter((item) => item.assigned_to_user_id === Number(assigneeFilter));
			}
		}

		return filtered;
	});

	function getTitle(item: Item): string {
		// Try to get first field value as title
		const firstValue = Object.values(item.values)[0];
		return firstValue || 'Untitled';
	}

	function getDescription(item: Item): string | undefined {
		// Try to get second field value as description
		const values = Object.values(item.values);
		return values[1] || undefined;
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-4">
		<div class="flex items-center gap-2">
			<Label for="priority-filter">Priority:</Label>
			<Select.Root
				type="single"
				value={priorityFilter}
				onValueChange={(v) => v && (priorityFilter = v)}
			>
				<Select.Trigger id="priority-filter" class="w-32">
					{priorityFilter === 'all' ? 'All' : priorityFilter}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all">All</Select.Item>
					<Select.Item value="urgent">Urgent</Select.Item>
					<Select.Item value="high">High</Select.Item>
					<Select.Item value="medium">Medium</Select.Item>
					<Select.Item value="low">Low</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>

		{#if onToggleArchived}
			<div class="flex items-center gap-2">
				<Checkbox id="show-archived" checked={showArchived} onCheckedChange={onToggleArchived} />
				<Label for="show-archived">Show archived</Label>
			</div>
		{/if}
	</div>

	{#if filteredItems.length === 0}
		<div class="rounded-lg border border-dashed p-12 text-center">
			<p class="text-lg text-muted-foreground">
				{items.length === 0 ? 'No tasks yet' : 'No tasks match the filters'}
			</p>
			{#if items.length === 0}
				<p class="mt-2 text-sm text-muted-foreground">Create your first task to get started</p>
			{/if}
		</div>
	{:else}
		<div class="space-y-3">
			{#each filteredItems as item (item.id)}
				<div class="group relative rounded-lg border p-4">
					<div class="flex gap-4">
						{#if onComplete && !item.is_archived}
							<div class="pt-1">
								<button
									type="button"
									onclick={() => onComplete?.(item)}
									class="text-muted-foreground transition-colors hover:text-green-600"
									aria-label="Complete task"
								>
									<CheckCircle class="size-5" />
								</button>
							</div>
						{/if}

						{#if categoryColor}
							<div class="pt-1.5">
								<div class="h-4 w-1 rounded-full" style="background-color: {categoryColor}"></div>
							</div>
						{/if}

						<div class="flex-1 space-y-2">
							<div class="flex items-start justify-between gap-2">
								<h3 class="text-base font-medium" class:line-through={item.is_archived}>
									{getTitle(item)}
								</h3>
								<div class="flex items-center gap-2">
									{#if item.priority}
										<PriorityBadge priority={item.priority} showLabel={false} />
									{/if}
									{#if item.assigned_to_user_id}
										<AssigneeAvatar name="Assigned" size="sm" />
									{/if}
								</div>
							</div>

							{#if getDescription(item)}
								<p class="text-sm text-muted-foreground">
									{getDescription(item)}
								</p>
							{/if}

							<div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
								{#if item.deadline}
									<time datetime={item.deadline}>
										Due: {new Date(item.deadline).toLocaleDateString()}
									</time>
								{/if}
								{#if item.time_estimate}
									<span>{formatMinutes(item.time_estimate)}</span>
								{/if}
								{#if item.recurring_config}
									<span class="rounded bg-muted px-2 py-0.5">
										{formatRecurringConfig(item.recurring_config)}
									</span>
								{/if}
							</div>
						</div>

						<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							{#if onEdit}
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onEdit?.(item)}
									aria-label="Edit task"
								>
									<Pencil class="size-4" />
								</Button>
							{/if}
							{#if onDelete}
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onDelete?.(item)}
									aria-label="Delete task"
								>
									<Trash2 class="size-4" />
								</Button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
