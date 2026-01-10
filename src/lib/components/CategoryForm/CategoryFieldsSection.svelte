<script lang="ts">
	import type { FieldInput } from './useCategoryFormState.svelte';
	import { Button } from '$lib/components/ui/Button';
	import { Input } from '$lib/components/ui/Input';
	import { Label } from '$lib/components/ui/Label';
	import { Textarea } from '$lib/components/ui/Textarea';
	import * as Select from '$lib/components/ui/Select';
	import { Plus, Trash2 } from 'lucide-svelte';

	type Props = {
		fields: FieldInput[];
		loading: boolean;
		errors: Record<string, string>;
		onAddField: () => void;
		onRemoveField: (index: number) => void;
		onUpdateField: (index: number, key: keyof FieldInput, value: string) => void;
	};

	let { fields, loading, errors, onAddField, onRemoveField, onUpdateField }: Props = $props();
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold">Custom Fields</h3>
		<Button type="button" variant="outline" size="sm" onclick={onAddField} disabled={loading}>
			<Plus class="mr-2 h-4 w-4" />
			Add Field
		</Button>
	</div>

	{#if fields.length === 0}
		<p class="text-sm text-muted-foreground">No custom fields yet</p>
	{:else}
		<div class="space-y-4">
			{#each fields as field, index (index)}
				<div class="space-y-3 rounded-lg border p-4">
					<div class="flex items-start justify-between">
						<h4 class="text-sm font-medium">Field {index + 1}</h4>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onclick={() => onRemoveField(index)}
							disabled={loading}
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>

					<div class="grid gap-3">
						<!-- Field Name -->
						<div class="space-y-1">
							<Label for="field-name-{index}">Field Name *</Label>
							<Input
								id="field-name-{index}"
								value={field.name}
								oninput={(e) => onUpdateField(index, 'name', e.currentTarget.value)}
								placeholder="e.g., Priority"
								required
								disabled={loading}
							/>
							{#if errors[`field_${index}_name`]}
								<p class="text-sm text-destructive">{errors[`field_${index}_name`]}</p>
							{/if}
						</div>

						<!-- Field Type -->
						<div class="space-y-1">
							<Label for="field-type-{index}">Field Type</Label>
							<Select.Root
								type="single"
								value={field.field_type}
								onValueChange={(v: string | undefined) =>
									v && onUpdateField(index, 'field_type', v)}
								disabled={loading}
							>
								<Select.Trigger id="field-type-{index}">
									{field.field_type
										? field.field_type.charAt(0).toUpperCase() + field.field_type.slice(1)
										: 'Select field type'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="text">Text</Select.Item>
									<Select.Item value="number">Number</Select.Item>
									<Select.Item value="date">Date</Select.Item>
									<Select.Item value="boolean">Boolean</Select.Item>
									<Select.Item value="select">Select</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>

						<!-- Options (for select type) -->
						{#if field.field_type === 'select'}
							<div class="space-y-1">
								<Label for="field-options-{index}">Options (one per line)</Label>
								<Textarea
									id="field-options-{index}"
									value={field.options ?? ''}
									oninput={(e) => onUpdateField(index, 'options', e.currentTarget.value)}
									placeholder="High&#10;Medium&#10;Low"
									rows={3}
									disabled={loading}
								/>
								<p class="text-xs text-muted-foreground">Enter each option on a new line</p>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
