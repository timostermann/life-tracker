export function urlFromInput(input: RequestInfo | URL): URL | null {
	try {
		if (input instanceof URL) return input;
		if (typeof input === 'string') return new URL(input, 'http://localhost');
		if (input instanceof Request) return new URL(input.url);
		return new URL(String(input), 'http://localhost');
	} catch {
		return null;
	}
}
