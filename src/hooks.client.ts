import { toast } from 'svelte-sonner';
import type { HandleFetch } from '@sveltejs/kit';

export const handleFetch: HandleFetch = async ({ request, fetch }) => {
	const response = await fetch(request);

	try {
		const url = new URL(request.url);
		const isApi = url.pathname.startsWith('/api/');
		const isAuthApi = url.pathname.startsWith('/api/auth/');

		if (isApi && !isAuthApi && response.status === 401) {
			toast.error('Unauthorized. Please log in.');
		}
	} catch {
		// ignore (non-URL request)
	}

	return response;
};
