<script lang="ts">
	import * as Tabs from '$lib/components/ui/Tabs';
	import { TemplateCard } from '$lib/components/TemplateCard';
	import type { Template } from '$lib/schemas';

	type Props = {
		templates: Template[];
		onApply: (templateId: number) => void;
	};

	let { templates, onApply }: Props = $props();

	const grouped = $derived.by(() => {
		const result: {
			task: Template[];
			chore: Template[];
			habit: Template[];
		} = { task: [], chore: [], habit: [] };

		templates.forEach((t) => {
			if (t.template_type in result) {
				result[t.template_type].push(t);
			}
		});

		return result;
	});
</script>

<Tabs.Root value="task" class="w-full">
	<Tabs.List class="grid w-full grid-cols-3">
		<Tabs.Trigger value="task">Tasks ({grouped.task.length})</Tabs.Trigger>
		<Tabs.Trigger value="chore">Chores ({grouped.chore.length})</Tabs.Trigger>
		<Tabs.Trigger value="habit">Habits ({grouped.habit.length})</Tabs.Trigger>
	</Tabs.List>

	<Tabs.Content value="task" class="mt-4">
		{#if grouped.task.length === 0}
			<p class="py-8 text-center text-muted-foreground">No task templates available</p>
		{:else}
			<div class="grid gap-4 md:grid-cols-2">
				{#each grouped.task as template (template.id)}
					<TemplateCard {template} {onApply} />
				{/each}
			</div>
		{/if}
	</Tabs.Content>

	<Tabs.Content value="chore" class="mt-4">
		{#if grouped.chore.length === 0}
			<p class="py-8 text-center text-muted-foreground">No chore templates available</p>
		{:else}
			<div class="grid gap-4 md:grid-cols-2">
				{#each grouped.chore as template (template.id)}
					<TemplateCard {template} {onApply} />
				{/each}
			</div>
		{/if}
	</Tabs.Content>

	<Tabs.Content value="habit" class="mt-4">
		{#if grouped.habit.length === 0}
			<p class="py-8 text-center text-muted-foreground">No habit templates available</p>
		{:else}
			<div class="grid gap-4 md:grid-cols-2">
				{#each grouped.habit as template (template.id)}
					<TemplateCard {template} {onApply} />
				{/each}
			</div>
		{/if}
	</Tabs.Content>
</Tabs.Root>
