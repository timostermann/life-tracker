export function messageFromBody(body: unknown, fallback: string) {
	if (body && typeof body === 'object') {
		const maybe = body as { error?: unknown; message?: unknown };
		if (typeof maybe.error === 'string' && maybe.error.trim()) return maybe.error;
		if (typeof maybe.message === 'string' && maybe.message.trim()) return maybe.message;
	}
	if (typeof body === 'string' && body.trim()) return body;
	return fallback;
}
