<script lang="ts">
	import Badge from '$lib/components/ui/Badge/Badge.svelte';
	import type { BadgeVariant } from '$lib/components/ui/Badge/Badge.svelte';

	type Props = {
		priority: 'urgent' | 'high' | 'medium' | 'low';
		showLabel?: boolean;
	};

	let { priority, showLabel = true }: Props = $props();

	let variant = $derived<BadgeVariant>(
		priority === 'urgent' ? 'destructive' : priority === 'high' ? 'secondary' : 'default'
	);
</script>

<Badge {variant} aria-label="Priority: {priority}">
	{#if showLabel}{priority}{/if}
</Badge>
