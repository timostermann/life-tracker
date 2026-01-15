<script lang="ts">
	import { Button } from '$lib/components/ui/Button';
	import { Pencil, Trash2, Plus, CheckCircle, XCircle } from 'lucide-svelte';
	import Badge from '$lib/components/ui/Badge/Badge.svelte';
	import type { HabitStats } from '$lib/schemas/habits';
	import type { HabitEntry } from '$lib/schemas/db';

	type Item = {
		id: number;
		values: Record<string, string>;
	};

	type Props = {
		items: Item[];
		habitStats?: Record<number, HabitStats>;
		habitEntries?: Record<number, HabitEntry[]>;
		onLog?: (item: Item, date?: string) => void;
		onEdit?: (item: Item) => void;
		onDelete?: (item: Item) => void;
		categoryColor?: string;
	};

	let {
		items,
		habitStats = {},
		habitEntries = {},
		onLog,
		onEdit,
		onDelete,
		categoryColor
	}: Props = $props();

	const today = new Date().toISOString().split('T')[0];

	function getTitle(item: Item): string {
		const firstValue = Object.values(item.values)[0];
		return firstValue || 'Untitled';
	}

	function getGoal(item: Item): string | undefined {
		const values = Object.values(item.values);
		return values[1] || undefined;
	}

	function isGoodHabit(item: Item): boolean | null {
		const values = Object.values(item.values);
		const isGoodValue = values.find((v) => v === 'true' || v === 'false');
		if (isGoodValue === undefined) return null;
		return isGoodValue === 'true';
	}

	function formatStreak(count: number): string {
		if (count === 0) return 'No streak';
		if (count === 1) return '1 day';
		return `${count} days`;
	}

	function hasTodayEntry(itemId: number): boolean {
		const entries = habitEntries[itemId] || [];
		return entries.some((e) => e.logged_date === today);
	}
</script>

<div class="space-y-3">
	{#if items.length === 0}
		<p class="py-8 text-center text-muted-foreground">
			No habits yet. Create your first habit to get started!
		</p>
	{:else}
		{#each items as item (item.id)}
			<div class="group relative rounded-lg border p-4">
				<div class="flex gap-4">
					{#if categoryColor}
						<div class="pt-1.5">
							<div class="h-4 w-1 rounded-full" style="background-color: {categoryColor}"></div>
						</div>
					{/if}

					<div class="flex-1 space-y-2">
						<div class="flex items-start justify-between gap-2">
							<div class="flex items-center gap-2">
								<h3 class="text-base font-medium">{getTitle(item)}</h3>
								{#if isGoodHabit(item) !== null}
									{#if isGoodHabit(item)}
										<CheckCircle class="size-4 text-green-600" aria-label="Good habit" />
									{:else}
										<XCircle class="size-4 text-red-600" aria-label="Bad habit" />
									{/if}
								{/if}
							</div>
							<div class="flex items-center gap-2">
								{#if habitStats[item.id]}
									<Badge variant="secondary">
										{formatStreak(habitStats[item.id].current_streak)}
									</Badge>
								{/if}
							</div>
						</div>

						{#if getGoal(item)}
							<p class="text-sm text-muted-foreground">{getGoal(item)}</p>
						{/if}

						{#if habitStats[item.id]}
							<div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
								<span>
									Last 7 days: {habitStats[item.id].last_7_days.done}/{habitStats[item.id]
										.last_7_days.total}
								</span>
								<span>
									Longest: {habitStats[item.id].longest_streak} days
								</span>
							</div>
						{/if}
					</div>

					<div class="flex gap-1">
						{#if onLog && !hasTodayEntry(item.id)}
							<Button
								variant="ghost"
								size="sm"
								onclick={() => onLog?.(item, today)}
								aria-label="Log today"
								title="Log today"
							>
								<Plus class="size-4" />
							</Button>
						{/if}
						{#if onEdit}
							<Button
								variant="ghost"
								size="sm"
								onclick={() => onEdit?.(item)}
								aria-label="Edit habit"
							>
								<Pencil class="size-4" />
							</Button>
						{/if}
						{#if onDelete}
							<Button
								variant="ghost"
								size="sm"
								onclick={() => onDelete?.(item)}
								aria-label="Delete habit"
							>
								<Trash2 class="size-4" />
							</Button>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>
