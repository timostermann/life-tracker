<script lang="ts">
	import type { Category } from '$lib/schemas';
	import { Button } from '$lib/components/ui/Button';
	import * as Card from '$lib/components/ui/Card';
	import { Pencil, Trash2 } from 'lucide-svelte';
	import { getColorClass, isTailwindColorName } from '$lib/utils/colors';

	type Props = {
		categories: Category[];
		onEdit: (category: Category) => void;
		onDelete: (category: Category) => void;
	};

	let { categories, onEdit, onDelete }: Props = $props();
</script>

{#if categories.length === 0}
	<div class="flex flex-col items-center justify-center py-12 text-center">
		<p class="text-lg text-muted-foreground">No categories yet</p>
		<p class="text-sm text-muted-foreground">Create your first category to get started</p>
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each categories as category (category.id)}
			<Card.Card>
				<Card.Header>
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-3">
							{#if category.icon}
								<span class="text-2xl">{category.icon}</span>
							{/if}
							<div>
								<Card.Title class="text-lg">{category.name}</Card.Title>
								<p class="mt-1 text-sm text-muted-foreground capitalize">
									{category.template_type}
								</p>
							</div>
						</div>
						{#if category.color && isTailwindColorName(category.color)}
							<div
								class="h-6 w-6 rounded-full border-2 border-gray-200 dark:border-gray-700 {getColorClass(
									category.color,
									'bg',
									'500'
								)}"
								aria-label="Color: {category.color}"
							></div>
						{/if}
					</div>
				</Card.Header>
				<Card.Footer class="flex justify-end gap-2">
					<Button variant="ghost" size="sm" onclick={() => onEdit(category)}>
						<Pencil class="mr-2 h-4 w-4" />
						Edit
					</Button>
					<Button variant="ghost" size="sm" onclick={() => onDelete(category)}>
						<Trash2 class="mr-2 h-4 w-4" />
						Delete
					</Button>
				</Card.Footer>
			</Card.Card>
		{/each}
	</div>
{/if}
