<script lang="ts">
	import type { Category } from '$lib/schemas';
	import { Button } from '$lib/components/ui/Button';
	import * as Card from '$lib/components/ui/Card';
	import { Pencil, Trash2, Users } from 'lucide-svelte';
	import { getColorClass, isTailwindColorName } from '$lib/utils/colors';
	import { resolve } from '$app/paths';

	type Props = {
		categories: Category[];
		onEdit: (category: Category) => void;
		onDelete: (category: Category) => void;
		onShare?: (category: Category) => void;
	};

	let { categories, onEdit, onDelete, onShare }: Props = $props();
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
					<a
						href={resolve(`/categories/${category.id}`)}
						class="flex items-start justify-between transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					>
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
								class="size-6 rounded-full border-2 border-border {getColorClass(
									category.color,
									'bg',
									'500'
								)}"
								aria-label="Color: {category.color}"
							></div>
						{/if}
					</a>
				</Card.Header>
				<Card.Footer class="flex justify-end gap-2">
					{#if onShare}
						<Button variant="ghost" size="sm" onclick={() => onShare?.(category)}>
							<Users class="mr-2 size-4" />
							Share
						</Button>
					{/if}
					<Button variant="ghost" size="sm" onclick={() => onEdit(category)}>
						<Pencil class="mr-2 size-4" />
						Edit
					</Button>
					<Button variant="ghost" size="sm" onclick={() => onDelete(category)}>
						<Trash2 class="mr-2 size-4" />
						Delete
					</Button>
				</Card.Footer>
			</Card.Card>
		{/each}
	</div>
{/if}
