import { describe, expect, it } from 'vitest';

import { messageFromBody } from './messageFromBody';

describe('messageFromBody', () => {
	it('uses body.error when present', () => {
		expect(messageFromBody({ error: 'Boom' }, 'fallback')).toBe('Boom');
	});

	it('uses body.message when error is missing', () => {
		expect(messageFromBody({ message: 'Nope' }, 'fallback')).toBe('Nope');
	});

	it('uses string body if present', () => {
		expect(messageFromBody('Plain text', 'fallback')).toBe('Plain text');
	});

	it('falls back when empty', () => {
		expect(messageFromBody(null, 'fallback')).toBe('fallback');
		expect(messageFromBody({ error: '' }, 'fallback')).toBe('fallback');
	});
});
