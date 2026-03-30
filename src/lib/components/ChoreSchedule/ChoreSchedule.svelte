<script lang="ts">
	import AssigneeAvatar from '$lib/components/AssigneeAvatar/AssigneeAvatar.svelte';
	import { CheckCircle, Calendar } from 'lucide-svelte';
	import type { RecurringConfig } from '$lib/schemas/items';
	import { formatRecurringConfig, calculateNextDate } from '$lib/utils/recurring';
	import { SvelteDate, SvelteMap } from 'svelte/reactivity';

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
		onComplete?: (item: Item) => void;
		categoryColor?: string;
	};

	let { items, onComplete, categoryColor }: Props = $props();

	function getTitle(item: Item): string {
		const firstValue = Object.values(item.values)[0];
		return firstValue || 'Untitled';
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

	function groupByDate(items: Item[]): Map<string, Item[]> {
		const grouped = new SvelteMap<string, Item[]>();
		const today = new SvelteDate();
		today.setHours(0, 0, 0, 0);

		for (const item of items) {
			const nextDate = getNextOccurrenceDate(item);
			if (!nextDate) continue;

			const dateKey = nextDate.toISOString().split('T')[0];
			if (!grouped.has(dateKey)) {
				grouped.set(dateKey, []);
			}
			grouped.get(dateKey)!.push(item);
		}

		return grouped;
	}

	let groupedItems = $derived(groupByDate(items));
	let sortedDates = $derived(
		Array.from(groupedItems.keys()).sort(
			(a, b) => new SvelteDate(a).getTime() - new SvelteDate(b).getTime()
		)
	);
</script>

<div class="space-y-6">
	{#if items.length === 0}
		<div class="rounded-lg border border-dashed p-12 text-center">
			<p class="text-lg text-muted-foreground">No upcoming chores</p>
			<p class="mt-2 text-sm text-muted-foreground">Chores will appear here when scheduled</p>
		</div>
	{:else}
		{#each sortedDates as dateKey (dateKey)}
			{@const date = new Date(dateKey)}
			{@const dateItems = groupedItems.get(dateKey) || []}
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<Calendar class="size-4 text-muted-foreground" />
					<h3 class="text-sm font-semibold">
						{date.toLocaleDateString('en-US', {
							weekday: 'long',
							month: 'long',
							day: 'numeric'
						})}
					</h3>
					<span class="text-xs text-muted-foreground">({dateItems.length})</span>
				</div>
				<div class="ml-6 space-y-2">
					{#each dateItems as item (item.id)}
						<div class="group flex items-center gap-3 rounded-lg border p-3">
							{#if onComplete}
								<button
									type="button"
									onclick={() => onComplete?.(item)}
									class="text-muted-foreground transition-colors hover:text-green-600"
									aria-label="Complete chore"
								>
									<CheckCircle class="size-5" />
								</button>
							{/if}

							{#if categoryColor}
								<div class="h-4 w-1 rounded-full" style="background-color: {categoryColor}"></div>
							{/if}

							<div class="flex-1">
								<h4 class="text-sm font-medium">{getTitle(item)}</h4>
								<div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
									{#if item.recurring_config}
										<span class="rounded bg-muted px-2 py-0.5">
											{formatRecurringConfig(item.recurring_config)}
										</span>
									{/if}
									{#if item.assigned_to_user_id && item.assigned_to_username}
										<AssigneeAvatar name={item.assigned_to_username} size="sm" />
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>
