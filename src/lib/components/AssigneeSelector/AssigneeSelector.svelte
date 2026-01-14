<script lang="ts">
	import * as Select from '$lib/components/ui/Select';
	import { Label } from '$lib/components/ui/Label';
	import { onMount } from 'svelte';
	import { fetchResource } from '$lib/utils/api';

	type User = {
		id: number;
		username: string;
	};

	type Props = {
		value?: number | null;
		onValueChange?: (value: number | null) => void;
		label?: string;
		id?: string;
	};

	let { value = null, onValueChange, label = 'Assign to', id }: Props = $props();

	let users = $state<User[]>([]);
	let loading = $state(true);

	onMount(async () => {
		const result = await fetchResource<{ users: User[] }>('/api/users');
		if (result.success && result.data) {
			users = result.data.users;
		}
		loading = false;
	});

	function handleChange(newValue: string | undefined) {
		if (newValue === 'none') {
			onValueChange?.(null);
		} else if (newValue) {
			onValueChange?.(Number(newValue));
		}
	}

	let selectedUser = $derived(users.find((u) => u.id === value));
</script>

<div class="space-y-2">
	{#if label}
		<Label for={id}>{label}</Label>
	{/if}
	<Select.Root
		type="single"
		value={value ? value.toString() : 'none'}
		onValueChange={handleChange}
		disabled={loading}
	>
		<Select.Trigger {id}>
			{#if loading}
				Loading...
			{:else if selectedUser}
				{selectedUser.username}
			{:else}
				Unassigned
			{/if}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="none">Unassigned</Select.Item>
			{#each users as user (user.id)}
				<Select.Item value={user.id.toString()}>{user.username}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
