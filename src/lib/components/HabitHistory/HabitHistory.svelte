<script lang="ts">
	import { Button } from '$lib/components/ui/Button';
	import { Pencil, Trash2 } from 'lucide-svelte';
	import type { HabitEntry } from '$lib/schemas/db';

	type Props = {
		entries: HabitEntry[];
		onEdit?: (entry: HabitEntry) => void;
		onDelete?: (entry: HabitEntry) => void;
	};

	let { entries, onEdit, onDelete }: Props = $props();

	function getStatusColor(status: HabitEntry['status']): string {
		switch (status) {
			case 'done':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'skipped':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'failed':
				return 'bg-red-100 text-red-800 border-red-200';
		}
	}

	function getStatusLabel(status: HabitEntry['status']): string {
		switch (status) {
			case 'done':
				return 'Done';
			case 'skipped':
				return 'Skipped';
			case 'failed':
				return 'Failed';
		}
	}

	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="space-y-3">
	{#if entries.length === 0}
		<p class="py-8 text-center text-muted-foreground">No entries yet</p>
	{:else}
		{#each entries as entry (entry.id)}
			<div class="rounded-lg border p-4">
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1">
						<div class="mb-2 flex items-center gap-2">
							<time datetime={entry.logged_date} class="font-medium">
								{formatDate(entry.logged_date)}
							</time>
							<span
								class="rounded-full border px-2 py-0.5 text-xs font-medium {getStatusColor(
									entry.status
								)}"
							>
								{getStatusLabel(entry.status)}
							</span>
						</div>
						{#if entry.notes}
							<p class="mt-2 text-sm text-muted-foreground">{entry.notes}</p>
						{/if}
					</div>
					<div class="flex gap-1">
						{#if onEdit}
							<Button
								variant="ghost"
								size="sm"
								onclick={() => onEdit?.(entry)}
								aria-label="Edit entry"
							>
								<Pencil class="size-4" />
							</Button>
						{/if}
						{#if onDelete}
							<Button
								variant="ghost"
								size="sm"
								onclick={() => onDelete?.(entry)}
								aria-label="Delete entry"
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
