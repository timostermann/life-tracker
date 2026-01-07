import { describe, expect, it } from 'vitest';

import { readBody } from './readBody';

describe('readBody', () => {
	it('parses JSON when content-type is application/json', async () => {
		const res = new Response(JSON.stringify({ ok: true }), {
			headers: { 'content-type': 'application/json' }
		});
		await expect(readBody(res)).resolves.toEqual({ ok: true });
	});

	it('returns text when content-type is not json', async () => {
		const res = new Response('hello', { headers: { 'content-type': 'text/plain' } });
		await expect(readBody(res)).resolves.toBe('hello');
	});

	it('returns text if JSON is invalid', async () => {
		const res = new Response('{', { headers: { 'content-type': 'application/json' } });
		await expect(readBody(res)).resolves.toBe('{');
	});

	it('returns null on empty body', async () => {
		const res = new Response('', { headers: { 'content-type': 'application/json' } });
		await expect(readBody(res)).resolves.toBeNull();
	});
});
