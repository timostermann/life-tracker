import type { Sql } from 'postgres';

export type Logger = (...args: unknown[]) => void;

type Migration = {
	version: number;
	filename: string;
};

const migrations: Migration[] = [
	{ version: 1, filename: '001_initial_schema.sql' },
	{ version: 2, filename: '002_seed_templates.sql' },
	{ version: 3, filename: '003_lucia_auth.sql' },
	{ version: 4, filename: '004_seed_tasks.sql' },
	{ version: 5, filename: '005_seed_chores.sql' },
	{ version: 6, filename: '006_seed_habits.sql' },
	{ version: 7, filename: '007_api_tokens.sql' }
];

// Bundle SQL migrations into the server build so production builds don't depend on .sql files existing on disk.
const bundledMigrations = import.meta.glob('./migrations/*.sql', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

function readMigrationSql(filename: string): string {
	const key = `./migrations/${filename}`;
	const content = bundledMigrations[key];
	if (!content) throw new Error(`Migration not found: ${filename}`);
	return content;
}

async function ensureSchemaVersionTable(sql: Sql) {
	await sql.unsafe(`
		CREATE TABLE IF NOT EXISTS schema_version (
			version INTEGER PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`);
}

async function getAppliedVersions(sql: Sql): Promise<Set<number>> {
	const rows = await sql<
		{ version: number }[]
	>`SELECT version FROM schema_version ORDER BY version ASC`;
	return new Set(rows.map((r) => r.version));
}

export async function migrate(sql: Sql, opts?: { log?: Logger }) {
	const log = opts?.log;

	await ensureSchemaVersionTable(sql);

	const applied = await getAppliedVersions(sql);
	const pending = migrations.filter((m) => !applied.has(m.version));
	if (pending.length === 0) {
		log?.('migrations: up-to-date');
		return;
	}

	await sql.begin(async (tx) => {
		log?.('migrations: applying', pending.map((m) => `${m.version}:${m.filename}`).join(', '));
		for (const m of pending) {
			const migrationSql = readMigrationSql(m.filename);
			await tx.unsafe(migrationSql);
			await tx`INSERT INTO schema_version (version) VALUES (${m.version})`;
			log?.('migrations: applied', m.version);
		}
	});
}

export async function backfillSeedData(sql: Sql, opts?: { log?: Logger }) {
	const log = opts?.log;
	const seedFiles = ['004_seed_tasks.sql', '005_seed_chores.sql', '006_seed_habits.sql'];

	await sql.begin(async (tx) => {
		log?.('seed data: backfilling', seedFiles.join(', '));
		for (const filename of seedFiles) {
			await tx.unsafe(readMigrationSql(filename));
			log?.('seed data: backfilled', filename);
		}
	});
}
