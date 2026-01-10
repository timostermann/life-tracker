<script lang="ts">
	import type { TailwindColorName } from '$lib/schemas/categories';
	import { Input } from '$lib/components/ui/Input';
	import { Label } from '$lib/components/ui/Label';
	import { Checkbox } from '$lib/components/ui/Checkbox';
	import * as Select from '$lib/components/ui/Select';
	import { ColorPicker } from '$lib/components/ColorPicker';

	type Props = {
		name: string;
		templateType: 'task' | 'chore' | 'habit';
		icon: string;
		color: TailwindColorName | undefined;
		isPrivate: boolean;
		mode: 'create' | 'edit';
		loading: boolean;
		errors: Record<string, string>;
		onNameChange: (value: string) => void;
		onTemplateTypeChange: (value: 'task' | 'chore' | 'habit') => void;
		onIconChange: (value: string) => void;
		onColorChange: (value: TailwindColorName | undefined) => void;
		onIsPrivateChange: (value: boolean) => void;
	};

	let {
		name,
		templateType,
		icon,
		color,
		isPrivate,
		mode,
		loading,
		errors,
		onNameChange,
		onTemplateTypeChange,
		onIconChange,
		onColorChange,
		onIsPrivateChange
	}: Props = $props();
</script>

<div class="space-y-4">
	<!-- Name -->
	<div class="space-y-2">
		<Label for="name">Name *</Label>
		<Input
			id="name"
			value={name}
			oninput={(e) => onNameChange(e.currentTarget.value)}
			placeholder="e.g., Work Tasks"
			required
			disabled={loading}
		/>
		{#if errors.name}
			<p class="text-sm text-destructive">{errors.name}</p>
		{/if}
	</div>

	<!-- Template Type -->
	<div class="space-y-2">
		<Label for="template-type">Template Type *</Label>
		<Select.Root
			type="single"
			value={templateType}
			onValueChange={(v: string | undefined) =>
				v && onTemplateTypeChange(v as 'task' | 'chore' | 'habit')}
			disabled={mode === 'edit' || loading}
		>
			<Select.Trigger id="template-type">
				{templateType
					? templateType.charAt(0).toUpperCase() + templateType.slice(1)
					: 'Select type'}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="task">Task</Select.Item>
				<Select.Item value="chore">Chore</Select.Item>
				<Select.Item value="habit">Habit</Select.Item>
			</Select.Content>
		</Select.Root>
		{#if mode === 'edit'}
			<p class="text-xs text-muted-foreground">Template type cannot be changed after creation</p>
		{/if}
	</div>

	<!-- Icon -->
	<div class="space-y-2">
		<Label for="icon">Icon (emoji)</Label>
		<Input
			id="icon"
			value={icon}
			oninput={(e) => onIconChange(e.currentTarget.value)}
			placeholder="e.g., 📋 or 🏠"
			maxlength={10}
			disabled={loading}
		/>
		<p class="text-xs text-muted-foreground">Paste an emoji or leave empty</p>
	</div>

	<!-- Color -->
	<div class="space-y-2">
		<Label>Color</Label>
		<ColorPicker value={color} onchange={onColorChange} />
	</div>

	<!-- Private Checkbox -->
	<div class="flex items-center space-x-2">
		<Checkbox
			id="is-private"
			checked={isPrivate}
			onCheckedChange={onIsPrivateChange}
			disabled={loading}
		/>
		<Label for="is-private" class="font-normal">Private (only you can see this category)</Label>
	</div>
</div>
