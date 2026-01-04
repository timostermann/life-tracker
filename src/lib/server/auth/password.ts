import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';

function scrypt(
	password: string,
	salt: Buffer,
	keyLength: number,
	options: { N: number; r: number; p: number }
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		_scrypt(password, salt, keyLength, options, (err, derivedKey) => {
			if (err) return reject(err);
			resolve(derivedKey as Buffer);
		});
	});
}

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

type ScryptHash = {
	N: number;
	r: number;
	p: number;
	saltHex: string;
	keyHex: string;
};

function formatHash(h: ScryptHash): string {
	return `scrypt$${h.N}$${h.r}$${h.p}$${h.saltHex}$${h.keyHex}`;
}

function parseHash(stored: string): ScryptHash | null {
	const parts = stored.split('$');
	if (parts.length !== 6) return null;
	if (parts[0] !== 'scrypt') return null;
	const [, N, r, p, saltHex, keyHex] = parts;
	const parsed = {
		N: Number(N),
		r: Number(r),
		p: Number(p),
		saltHex,
		keyHex
	};
	if (!Number.isFinite(parsed.N) || !Number.isFinite(parsed.r) || !Number.isFinite(parsed.p))
		return null;
	if (!parsed.saltHex || !parsed.keyHex) return null;
	return parsed;
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(SALT_LENGTH);
	// Reasonable defaults; can be tuned later if needed.
	const N = 16384;
	const r = 8;
	const p = 1;
	const derivedKey = await scrypt(password, salt, KEY_LENGTH, { N, r, p });
	return formatHash({
		N,
		r,
		p,
		saltHex: salt.toString('hex'),
		keyHex: derivedKey.toString('hex')
	});
}

export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
	const parsed = parseHash(storedHash);
	if (!parsed) return false;

	const salt = Buffer.from(parsed.saltHex, 'hex');
	const expected = Buffer.from(parsed.keyHex, 'hex');
	const actual = await scrypt(password, salt, expected.length, {
		N: parsed.N,
		r: parsed.r,
		p: parsed.p
	});

	// timing-safe compare
	if (actual.length !== expected.length) return false;
	return timingSafeEqual(actual, expected);
}
