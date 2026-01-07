export async function readBody(response: Response): Promise<unknown> {
	try {
		const text = await response.text();
		if (!text) return null;

		const contentType = response.headers.get('content-type') ?? '';
		if (!contentType.includes('application/json')) return text;

		try {
			return JSON.parse(text) as unknown;
		} catch {
			// invalid JSON, but still useful for debugging / fallback message extraction
			return text;
		}
	} catch {
		return null;
	}
}
