<script lang="ts">
	import { Button } from '$lib/components/ui/Button';
	import AssigneeAvatar from '$lib/components/AssigneeAvatar/AssigneeAvatar.svelte';
	import { Label } from '$lib/components/ui/Label';
	import { Checkbox } from '$lib/components/ui/Checkbox';
	import { CheckCircle, Pencil, Trash2, Calendar } from 'lucide-svelte';
	import type { RecurringConfig } from '$lib/schemas/items';
	import { formatRecurringConfig, calculateNextDate } from '$lib/utils/recurring';
	import { SvelteDate } from 'svelte/reactivity';

	type Item = {
		id: number;
		assigned_to_user_id?: number | null;
		assigned_to_username?: string | null;
		is_archived: boolean;
		recurring_config?: RecurringConfig | null;
		next_show_date?: string | null;
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

	let assigneeFilter = $state<string>('all');

	let filteredItems = $derived.by(() => {
		if (assigneeFilter === 'all') {
			return items;
		}
		if (assigneeFilter === 'unassigned') {
			return items.filter((item) => !item.assigned_to_user_id);
		}
		return items.filter((item) => item.assigned_to_user_id === Number(assigneeFilter));
	});

	function getTitle(item: Item): string {
		const firstValue = Object.values(item.values)[0];
		return firstValue || 'Untitled';
	}

	function getDescription(item: Item): string | undefined {
		const values = Object.values(item.values);
		return values[1] || undefined;
	}

	function getNextOccurrenceDate(item: Item): Date | null {
		if (item.next_show_date) {
			return new Date(item.next_show_date);
		}
		if (item.recurring_config) {
			return calculateNextDate(item.recurring_config, new Date());
		}
		return null;
	}

	function formatNextDate(date: Date | null): string {
		if (!date) return 'Not scheduled';
		const today = new SvelteDate();
		today.setHours(0, 0, 0, 0);
		const dateOnly = new SvelteDate(date);
		dateOnly.setHours(0, 0, 0, 0);

		if (dateOnly.getTime() === today.getTime()) {
			return 'Today';
		}
		if (dateOnly.getTime() < today.getTime()) {
			const daysDiff = Math.floor((today.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));
			return `${daysDiff} day${daysDiff === 1 ? '' : 's'} overdue`;
		}

		const daysDiff = Math.floor((dateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		if (daysDiff === 1) {
			return 'Tomorrow';
		}
		if (daysDiff <= 7) {
			return `In ${daysDiff} days`;
		}
		return date.toLocaleDateString();
	}

	function isOverdue(item: Item): boolean {
		const nextDate = getNextOccurrenceDate(item);
		if (!nextDate) return false;
		const today = new SvelteDate();
		today.setHours(0, 0, 0, 0);
		return nextDate < today;
	}
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-4">
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
				{items.length === 0 ? 'No chores yet' : 'No chores match the filters'}
			</p>
			{#if items.length === 0}
				<p class="mt-2 text-sm text-muted-foreground">Create your first chore to get started</p>
			{/if}
		</div>
	{:else}
		<div class="space-y-3">
			{#each filteredItems as item (item.id)}
				<div
					class="group relative rounded-lg border p-4"
					class:border-destructive={isOverdue(item)}
				>
					<div class="flex gap-4">
						{#if onComplete && !item.is_archived}
							<div class="pt-1">
								<button
									type="button"
									onclick={() => onComplete?.(item)}
									class="text-muted-foreground transition-colors hover:text-green-600"
									aria-label="Complete chore"
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
									{#if item.assigned_to_user_id && item.assigned_to_username}
										<AssigneeAvatar name={item.assigned_to_username} size="sm" />
									{/if}
								</div>
							</div>

							{#if getDescription(item)}
								<p class="text-sm text-muted-foreground">
									{getDescription(item)}
								</p>
							{/if}

							<div class="flex flex-wrap items-center gap-3 text-xs">
								{#if item.recurring_config}
									<span class="rounded bg-muted px-2 py-0.5">
										{formatRecurringConfig(item.recurring_config)}
									</span>
								{/if}
								{#if !item.is_archived}
									{@const overdue = isOverdue(item)}
									<div
										class="flex items-center gap-1 rounded px-2 py-0.5 {overdue
											? 'bg-destructive/10 text-destructive'
											: 'bg-muted text-muted-foreground'}"
									>
										<Calendar class="size-3" />
										<span>
											Next: {formatNextDate(getNextOccurrenceDate(item))}
										</span>
									</div>
								{/if}
							</div>
						</div>

						<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							{#if onEdit}
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onEdit?.(item)}
									aria-label="Edit chore"
								>
									<Pencil class="size-4" />
								</Button>
							{/if}
							{#if onDelete}
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onDelete?.(item)}
									aria-label="Delete chore"
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
