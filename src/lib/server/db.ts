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
	const configured = env.DATABASE_PATH?.trim();
	if (configured) return configured;

	// Dev-friendly fallback (no env needed)
	if (process.env.NODE_ENV !== 'production') return './.data/db.sqlite';

	// Production-friendly fallback (container volume mount at /data)
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
	db.pragma('journal_mode = WAL');
	db.pragma('busy_timeout = 5000');
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
