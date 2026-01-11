import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

import type { Database as BetterSqlite3Database } from 'better-sqlite3';

import { env } from '$env/dynamic/private';
import { migrate } from './db/migrate';
import { createLogger } from './logging';

let singletonDb: BetterSqlite3Database | null = null;

const logger = createLogger('db', { envFlag: 'DB_LOG' });

function resolveDatabasePath(): string {
	// Check process.env first (for tests that set it directly),
	// then fall back to SvelteKit's $env (for normal runtime)
	const configured = process.env.DATABASE_PATH?.trim() || env.DATABASE_PATH?.trim();
	if (configured) return configured;

	if (process.env.NODE_ENV !== 'production') return './.data/db.sqlite';

	return '/data/db.sqlite';
}

function ensureParentDirExists(dbPath: string) {
	if (dbPath === ':memory:') return;

	const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
	const dir = path.dirname(absolutePath);
	fs.mkdirSync(dir, { recursive: true });
}

function configureDb(db: BetterSqlite3Database) {
	db.pragma('foreign_keys = ON');

	try {
		// WAL (Write-Ahead Logging) mode provides better concurrency:
		// - Readers don't block writers
		// - Writers don't block readers
		// - Better performance for web apps with multiple connections
		// See: https://www.sqlite.org/wal.html
		db.pragma('journal_mode = WAL');
		db.pragma('busy_timeout = 5000');
	} catch (error) {
		// In test environments, WAL mode may fail due to filesystem limitations
		// or when using in-memory databases. Fall back to DELETE mode:
		// - Traditional rollback journal
		// - More restrictive locking (writers block readers)
		// - Acceptable for tests since they use isolated databases
		if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
			try {
				db.pragma('journal_mode = DELETE');
				db.pragma('busy_timeout = 5000');
			} catch {
				console.error('Failed to configure database journal mode:', error);
			}
		} else {
			console.error('Failed to configure database journal mode:', error);
			throw error;
		}
	}
}

export function getDb(): BetterSqlite3Database {
	if (singletonDb) return singletonDb;

	const dbPath = resolveDatabasePath();
	ensureParentDirExists(dbPath);

	logger.info('opening', dbPath);

	const db = new Database(dbPath);
	configureDb(db);
	migrate(db, { log: logger.info });

	singletonDb = db;
	logger.info('ready');
	return singletonDb;
}

export function closeDbForTests() {
	if (!singletonDb) return;
	logger.info('closing');
	singletonDb.close();
	singletonDb = null;
}
