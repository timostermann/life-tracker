import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry } from '@sentry/sveltekit';
import type { HandleFetch } from '@sveltejs/kit';

const isDev = import.meta.env.DEV;

Sentry.init({
	dsn: isDev ? 'https://spotlight@local/0' : (import.meta.env.PUBLIC_SENTRY_DSN ?? undefined),
	environment: import.meta.env.MODE,
	tracesSampleRate: isDev ? 1.0 : 0.05,
	debug: false,
	replaysOnErrorSampleRate: 1.0,
	replaysSessionSampleRate: 0.02,
	integrations: [
		Sentry.replayIntegration(),
		...(isDev ? [Sentry.spotlightBrowserIntegration()] : [])
	]
});

export const handleFetch: HandleFetch = async ({ request, fetch }) => {
	return fetch(request);
};

export const handleError = handleErrorWithSentry();
