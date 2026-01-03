import fs from 'node:fs';

import type { Database as BetterSqlite3Database } from 'better-sqlite3';

export type Logger = (...args: unknown[]) => void;

type Migration = {
	version: number;
	filename: string;
};

const migrations: Migration[] = [
	{ version: 1, filename: '001_initial_schema.sql' },
	{ version: 2, filename: '002_seed_templates.sql' },
	{ version: 3, filename: '003_lucia_auth.sql' }
];

function readMigrationSql(filename: string): string {
	const url = new URL(`./migrations/${filename}`, import.meta.url);
	return fs.readFileSync(url, 'utf8');
}

function ensureSchemaVersionTable(db: BetterSqlite3Database) {
	db.exec(`
		CREATE TABLE IF NOT EXISTS schema_version (
			version INTEGER PRIMARY KEY,
			applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
	`);
}

function getAppliedVersions(db: BetterSqlite3Database): Set<number> {
	const rows = db
		.prepare<[], { version: number }>('SELECT version FROM schema_version ORDER BY version ASC')
		.all();
	return new Set(rows.map((r) => r.version));
}

export function migrate(db: BetterSqlite3Database, opts?: { log?: Logger }) {
	const log = opts?.log;

	ensureSchemaVersionTable(db);

	const applied = getAppliedVersions(db);
	const pending = migrations.filter((m) => !applied.has(m.version));
	if (pending.length === 0) {
		log?.('migrations: up-to-date');
		return;
	}

	const run = db.transaction(() => {
		log?.('migrations: applying', pending.map((m) => `${m.version}:${m.filename}`).join(', '));
		for (const m of pending) {
			const sql = readMigrationSql(m.filename);
			db.exec(sql);
			db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(m.version);
			log?.('migrations: applied', m.version);
		}
	});

	run();
}
