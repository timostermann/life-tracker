const path = require('path');

const prettierCommand = (filenames) =>
	`prettier --write ${filenames.map((filename) => `"${filename}"`).join(' ')}`;

const buildEslintCommand = (filenames) =>
	`eslint --cache --concurrency=4 --fix ${filenames
		.map((f) => path.relative(process.cwd(), f))
		.join(' ')}`;

const testCommand = (filenames) =>
	`npm run test:unit -- related --run ${filenames.map((filename) => `"${filename}"`).join(' ')}`;

module.exports = {
	'**/*.{js,cjs,mjs,ts,svelte}': [prettierCommand, buildEslintCommand],
	'**/*.{json,yml,css}': [prettierCommand],
	'**/*': [testCommand]
};
