import postgres from 'postgres';

import { env } from '$env/dynamic/private';
import { migrate } from './db/migrate';
import { createLogger } from './logging';

export type { Sql } from 'postgres';

const logger = createLogger('db', { envFlag: 'DB_LOG' });

let sql: postgres.Sql | undefined;
const isTest = import.meta.env.VITEST || process.env.VITEST || process.env.NODE_ENV === 'test';

function createDb() {
	if (!env.POSTGRES_URL) throw new Error('POSTGRES_URL is required');
	return postgres(env.POSTGRES_URL, {
		max: 10,
		types: {
			// bigint (OID 20) returned as JS number instead of string
			bigint: {
				to: 20,
				from: [20],
				serialize: (x: unknown) => String(x),
				parse: (x: string) => Number(x)
			}
		}
	});
}

// Run migrations once at module load; callers await this before first query.
let dbReadyPromise: Promise<void> | undefined;

export function ensureDbReady() {
	if (isTest) return Promise.resolve();
	dbReadyPromise ??= migrate(getDb(), { log: logger.info }).then(() => {
		logger.info('ready');
	});
	return dbReadyPromise;
}

export const dbReady = {
	then<TResult1 = void, TResult2 = never>(
		onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
	) {
		return ensureDbReady().then(onfulfilled, onrejected);
	}
};

export function getDb() {
	sql ??= createDb();
	return sql;
}

export async function closeDbForTests() {
	await sql?.end();
	sql = undefined;
}
