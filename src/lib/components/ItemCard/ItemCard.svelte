<script lang="ts">
	import { cn } from '$lib/utils';
	import Checkbox from '$lib/components/ui/Checkbox/Checkbox.svelte';
	import PriorityBadge from '$lib/components/PriorityBadge/PriorityBadge.svelte';

	type Props = {
		title: string;
		description?: string;
		priority?: 'urgent' | 'high' | 'medium' | 'low';
		dueDate?: Date;
		completed?: boolean;
		categoryColor?: string;
		ontoggle?: () => void;
		onclick?: () => void;
	};

	let {
		title,
		description,
		priority,
		dueDate,
		completed = false,
		categoryColor,
		ontoggle,
		onclick
	}: Props = $props();

	let formattedDueDate = $derived(
		dueDate
			? new Intl.DateTimeFormat('en-US', {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				}).format(dueDate)
			: null
	);

	let descriptionId = $derived(`item-desc-${Math.random().toString(36).substr(2, 9)}`);
</script>

{#if onclick}
	<button
		type="button"
		class={cn(
			'flex gap-3 rounded-lg border border-border p-4 text-left',
			completed && 'opacity-60',
			'cursor-pointer transition-colors hover:bg-accent/30'
		)}
		aria-describedby={description ? descriptionId : undefined}
		onclick={() => onclick?.()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onclick?.();
			}
		}}
	>
		{#if ontoggle}
			<div class="pt-0.5">
				<Checkbox
					checked={completed}
					onCheckedChange={ontoggle}
					aria-label="Mark as {completed ? 'incomplete' : 'complete'}"
				/>
			</div>
		{/if}

		{#if categoryColor}
			<div class="pt-1.5">
				<div class="h-4 w-1 rounded-full" style="background-color: {categoryColor}"></div>
			</div>
		{/if}

		<div class="flex-1 space-y-2">
			<div class="flex items-start justify-between gap-2">
				<h3 class={cn('text-base font-medium', completed && 'line-through')}>
					{title}
				</h3>
				{#if priority}
					<PriorityBadge {priority} showLabel={false} />
				{/if}
			</div>

			{#if description}
				<p id={descriptionId} class="text-sm text-muted-foreground">
					{description}
				</p>
			{/if}

			{#if dueDate}
				<time datetime={dueDate.toISOString()} class="text-xs text-muted-foreground">
					Due: {formattedDueDate}
				</time>
			{/if}
		</div>
	</button>
{:else}
	<article
		class={cn(
			'flex gap-3 rounded-lg border border-border p-4 text-left',
			completed && 'opacity-60'
		)}
		aria-describedby={description ? descriptionId : undefined}
	>
		{#if ontoggle}
			<div class="pt-0.5">
				<Checkbox
					checked={completed}
					onCheckedChange={ontoggle}
					aria-label="Mark as {completed ? 'incomplete' : 'complete'}"
				/>
			</div>
		{/if}

		{#if categoryColor}
			<div class="pt-1.5">
				<div class="h-4 w-1 rounded-full" style="background-color: {categoryColor}"></div>
			</div>
		{/if}

		<div class="flex-1 space-y-2">
			<div class="flex items-start justify-between gap-2">
				<h3 class={cn('text-base font-medium', completed && 'line-through')}>
					{title}
				</h3>
				{#if priority}
					<PriorityBadge {priority} showLabel={false} />
				{/if}
			</div>

			{#if description}
				<p id={descriptionId} class="text-sm text-muted-foreground">
					{description}
				</p>
			{/if}

			{#if dueDate}
				<time datetime={dueDate.toISOString()} class="text-xs text-muted-foreground">
					Due: {formattedDueDate}
				</time>
			{/if}
		</div>
	</article>
{/if}
