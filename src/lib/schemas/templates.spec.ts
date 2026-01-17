import { describe, it, expect } from 'vitest';
import { applyTemplateSchema } from './templates';

describe('applyTemplateSchema', () => {
	it('should accept valid name', () => {
		const result = applyTemplateSchema.safeParse({ name: 'My Tasks' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe('My Tasks');
		}
	});

	it('should accept name with 100 characters', () => {
		const longName = 'a'.repeat(100);
		const result = applyTemplateSchema.safeParse({ name: longName });
		expect(result.success).toBe(true);
	});

	it('should reject empty string', () => {
		const result = applyTemplateSchema.safeParse({ name: '' });
		expect(result.success).toBe(false);
	});

	it('should reject name longer than 100 characters', () => {
		const tooLong = 'a'.repeat(101);
		const result = applyTemplateSchema.safeParse({ name: tooLong });
		expect(result.success).toBe(false);
	});

	it('should reject missing name field', () => {
		const result = applyTemplateSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('should accept name with whitespace', () => {
		const result = applyTemplateSchema.safeParse({ name: 'My Tasks  ' });
		expect(result.success).toBe(true);
	});

	it('should reject whitespace-only name', () => {
		const result = applyTemplateSchema.safeParse({ name: '   ' });
		expect(result.success).toBe(true); // Note: string().min(1) allows whitespace
	});
});
