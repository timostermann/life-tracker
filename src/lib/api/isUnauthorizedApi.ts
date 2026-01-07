export function isUnauthorizedApi(url: URL | null, status: number) {
	if (!url) return false;
	if (status !== 401) return false;
	const p = url.pathname;
	return p.startsWith('/api/') && !p.startsWith('/api/auth/');
}
