<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { cn } from '$lib/utils';

	type Props = {
		title: string;
		emptyMessage?: string;
		hasItems: boolean;
		viewAllHref?: string; // Pre-resolved href (caller must use resolve() from $app/paths)
		class?: string;
		children?: import('svelte').Snippet;
	};

	let { title, emptyMessage, hasItems, viewAllHref, class: className, children }: Props = $props();
</script>

<section class={cn('space-y-4', className)}>
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">{title}</h2>
		{#if viewAllHref && hasItems}
			<!-- viewAllHref is pre-resolved by caller using resolve() from $app/paths -->
			<a
				href={viewAllHref}
				class="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
			>
				View All →
			</a>
		{/if}
	</div>

	{#if !hasItems && emptyMessage}
		<p class="py-8 text-center text-muted-foreground">
			{emptyMessage}
		</p>
	{:else if children}
		{@render children()}
	{/if}
</section>
