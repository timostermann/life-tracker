import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svgPath = join(__dirname, '../src/lib/assets/favicon.svg');
const staticPath = join(__dirname, '../static');

const sizes = [
	{ size: 192, name: 'icon-192.png' },
	{ size: 512, name: 'icon-512.png' }
];

async function generateIcons() {
	const svgBuffer = readFileSync(svgPath);

	for (const { size, name } of sizes) {
		await sharp(svgBuffer).resize(size, size).png().toFile(join(staticPath, name));

		console.log(`✓ Generated ${name} (${size}x${size})`);
	}
}

generateIcons().catch(console.error);
