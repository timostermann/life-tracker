import { describe, it, expect } from 'vitest';
import { API_TOKEN_NAME_MAX_LENGTH, createApiTokenSchema } from './apiTokens';

describe('createApiTokenSchema', () => {
	it('accepts a non-empty name', () => {
		const r = createApiTokenSchema.safeParse({ name: 'Claude' });
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.name).toBe('Claude');
	});

	it('rejects empty name', () => {
		const r = createApiTokenSchema.safeParse({ name: '' });
		expect(r.success).toBe(false);
	});

	it('rejects name longer than max', () => {
		const r = createApiTokenSchema.safeParse({ name: 'x'.repeat(API_TOKEN_NAME_MAX_LENGTH + 1) });
		expect(r.success).toBe(false);
	});

	it('accepts name at max length', () => {
		const name = 'x'.repeat(API_TOKEN_NAME_MAX_LENGTH);
		const r = createApiTokenSchema.safeParse({ name });
		expect(r.success).toBe(true);
		if (r.success) expect(r.data.name).toBe(name);
	});
});
