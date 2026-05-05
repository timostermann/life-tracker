import { env } from '$env/dynamic/private';

type Level = 'debug' | 'info' | 'warn' | 'error';

export type Logger = {
	enabled: boolean;
	debug: (...args: unknown[]) => void;
	info: (...args: unknown[]) => void;
	warn: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
};

function parseBool(v: string | undefined): boolean {
	if (!v) return false;
	const n = v.trim().toLowerCase();
	return n === '1' || n === 'true' || n === 'yes' || n === 'on';
}

function isLevelEnabled(current: Level, target: Level): boolean {
	const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
	return order[target] >= order[current];
}

function resolveEnabled(scope: string, envFlag?: string): boolean {
	if (envFlag && parseBool(env[envFlag] ?? process.env[envFlag])) return true;

	if (parseBool(env.LOG ?? process.env.LOG)) return true;

	const scopes =
		(env.LOG_SCOPES ?? process.env.LOG_SCOPES)
			?.split(',')
			.map((s) => s.trim())
			.filter(Boolean) ?? [];
	return scopes.includes(scope);
}

function resolveLevel(): Level {
	const raw = (env.LOG_LEVEL ?? process.env.LOG_LEVEL)?.trim().toLowerCase();
	if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') return raw;
	return 'info';
}

export function createLogger(scope: string, opts?: { envFlag?: string }): Logger {
	const enabled = resolveEnabled(scope, opts?.envFlag);
	const level = resolveLevel();

	const prefix = `[${scope}]`;
	const emit =
		(method: 'debug' | 'info' | 'warn' | 'error', targetLevel: Level) =>
		(...args: unknown[]) => {
			if (!enabled) return;
			if (!isLevelEnabled(level, targetLevel)) return;
			console[method](prefix, ...args);
		};

	return {
		enabled,
		debug: emit('debug', 'debug'),
		info: emit('info', 'info'),
		warn: emit('warn', 'warn'),
		error: emit('error', 'error')
	};
}
