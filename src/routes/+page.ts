import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	// Auth is handled by hooks.server.ts
	// Fetch dashboard data from API
	const response = await fetch('/api/dashboard');

	if (!response.ok) {
		throw new Error('Failed to load dashboard data');
	}

	const data = await response.json();

	return {
		categories: data.categories,
		assigned_to_me: data.assigned_to_me,
		due_soon: data.due_soon,
		habits_today: data.habits_today
	};
};
