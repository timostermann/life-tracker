<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		name: string;
		icon: string;
		color: string;
		itemCount: number;
		onclick?: () => void;
	};

	let { name, icon, color, itemCount, onclick }: Props = $props();

	let isInteractive = $derived(!!onclick);
</script>

{#if isInteractive}
	<button
		class={cn(
			'flex flex-col gap-2 rounded-lg border border-border p-4 text-left transition-colors hover:cursor-pointer hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
		)}
		{onclick}
		aria-label="Category: {name}, {itemCount} items"
	>
		<div class="flex items-center gap-2">
			<span class="text-2xl" style="color: {color}">{icon}</span>
			<h3 class="text-lg font-semibold">{name}</h3>
		</div>
		<p class="text-sm text-muted-foreground">
			{itemCount}
			{itemCount === 1 ? 'item' : 'items'}
		</p>
	</button>
{:else}
	<article
		class={cn('flex flex-col gap-2 rounded-lg border border-border p-4')}
		aria-label="Category: {name}, {itemCount} items"
	>
		<div class="flex items-center gap-2">
			<span class="text-2xl" style="color: {color}">{icon}</span>
			<h3 class="text-lg font-semibold">{name}</h3>
		</div>
		<p class="text-sm text-muted-foreground">
			{itemCount}
			{itemCount === 1 ? 'item' : 'items'}
		</p>
	</article>
{/if}
