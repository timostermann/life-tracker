import { RuleConfigSeverity } from '@commitlint/types';
import type { RulesConfig } from '@commitlint/types';

const rules: Partial<RulesConfig> = {
	'header-max-length': [RuleConfigSeverity.Error, 'always', 200],
	'scope-enum': [RuleConfigSeverity.Disabled],
	'function-rules/scope-enum': [
		RuleConfigSeverity.Error,
		'always',
		(parsed) => {
			const allowedScopes = [
				'setup',
				'db',
				'auth',
				'categories',
				'items',
				'habits',
				'ui',
				'docs',
				'api',
				'pwa',
				'ci'
			];

			if (!parsed.scope) {
				return [false, 'scope is required'];
			}

			// Allow named scopes
			if (allowedScopes.includes(parsed.scope)) {
				return [true];
			}

			// Allow 3-digit ticket numbers (001, 002, etc.)
			if (/^\d{3}$/.test(parsed.scope)) {
				return [true];
			}

			return [
				false,
				`scope must be one of [${allowedScopes.join(', ')}] or a 3-digit ticket number (e.g., 001)`
			];
		}
	],
	'scope-empty': [RuleConfigSeverity.Warning, 'never']
};

const config = {
	extends: ['@commitlint/config-conventional'],
	plugins: ['commitlint-plugin-function-rules'],
	rules
};

export default config;
