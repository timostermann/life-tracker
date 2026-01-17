<script lang="ts">
	import { Card, Header, Title, Description, Content, Footer } from '$lib/components/ui/Card';
	import { Button } from '$lib/components/ui/Button';
	import type { Template } from '$lib/schemas';
	import { parseTemplateConfig } from '$lib/utils/templates';

	type Props = {
		template: Template;
		onApply: (templateId: number) => void;
	};

	let { template, onApply }: Props = $props();

	let config = $derived.by(() => {
		const parsed = parseTemplateConfig(template.category_config);
		return parsed || { name: '', fields: [] };
	});
</script>

<Card class="h-full">
	<Header>
		<div class="flex items-center gap-3">
			{#if template.icon}
				<span class="text-3xl">{template.icon}</span>
			{/if}
			<div class="flex-1">
				<Title>{template.name}</Title>
				{#if template.description}
					<Description>{template.description}</Description>
				{/if}
			</div>
		</div>
	</Header>
	<Content>
		<div class="space-y-2">
			<p class="text-sm font-medium text-muted-foreground">Fields included:</p>
			<ul class="space-y-1">
				{#each config.fields as field (field.name)}
					<li class="text-sm">
						<span class="font-medium">{field.name}</span>
						<span class="text-muted-foreground">({field.field_type})</span>
					</li>
				{/each}
			</ul>
		</div>
	</Content>
	<Footer>
		<Button onclick={() => onApply(template.id)} class="w-full">Use Template</Button>
	</Footer>
</Card>
