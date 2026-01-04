import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password';

describe('auth/password (scrypt)', () => {
	it('hashes and verifies password', async () => {
		const hash = await hashPassword('secret');
		expect(hash.startsWith('scrypt$')).toBe(true);

		await expect(verifyPassword(hash, 'secret')).resolves.toBe(true);
		await expect(verifyPassword(hash, 'wrong')).resolves.toBe(false);
	});
});
