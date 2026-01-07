import { describe, expect, it } from 'vitest';

import { urlFromInput } from './urlFromInput';

describe('urlFromInput', () => {
	it('returns a URL for absolute string', () => {
		const url = urlFromInput('https://example.com/api/x');
		expect(url?.hostname).toBe('example.com');
		expect(url?.pathname).toBe('/api/x');
	});

	it('treats relative string as relative to localhost', () => {
		const url = urlFromInput('/api/x');
		expect(url?.hostname).toBe('localhost');
		expect(url?.pathname).toBe('/api/x');
	});

	it('returns null for invalid input', () => {
		const url = urlFromInput('http://[::1');
		expect(url).toBeNull();
	});
});
