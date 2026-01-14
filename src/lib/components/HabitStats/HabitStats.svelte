<script lang="ts">
	import type { HabitStats as HabitStatsType } from '$lib/schemas/habits';
	import * as Card from '$lib/components/ui/Card';

	type Props = {
		stats: HabitStatsType;
	};

	let { stats }: Props = $props();
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
	<Card.Card>
		<Card.Header>
			<Card.Title class="text-sm font-medium">Current Streak</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="text-2xl font-bold">{stats.current_streak}</div>
			<p class="text-xs text-muted-foreground">days in a row</p>
		</Card.Content>
	</Card.Card>

	<Card.Card>
		<Card.Header>
			<Card.Title class="text-sm font-medium">Longest Streak</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="text-2xl font-bold">{stats.longest_streak}</div>
			<p class="text-xs text-muted-foreground">days</p>
		</Card.Content>
	</Card.Card>

	<Card.Card>
		<Card.Header>
			<Card.Title class="text-sm font-medium">Last 7 Days</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="text-2xl font-bold">
				{stats.last_7_days.done}/{stats.last_7_days.total}
			</div>
			<p class="text-xs text-muted-foreground">
				{Math.round((stats.last_7_days.done / stats.last_7_days.total) * 100)}% completion
			</p>
		</Card.Content>
	</Card.Card>

	<Card.Card>
		<Card.Header>
			<Card.Title class="text-sm font-medium">Last 30 Days</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="text-2xl font-bold">
				{stats.last_30_days.done}/{stats.last_30_days.total}
			</div>
			<p class="text-xs text-muted-foreground">
				{Math.round((stats.last_30_days.done / stats.last_30_days.total) * 100)}% completion
			</p>
		</Card.Content>
	</Card.Card>
</div>
