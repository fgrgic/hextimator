import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	buildTokenEntries,
	withInvertedSuffix,
} from '../src/format/buildTokenEntries';
import { formatPropertyAwareTailwind } from '../src/format/formatters';
import { generate } from '../src/generate/generate';
import { propertyColors } from '../src/generate/propertyColors';
import { parse } from '../src/parse';

const root = join(import.meta.dirname, '..');
const entries = buildTokenEntries(
	propertyColors(generate(parse('#737373'), 'light'), 'light', {}),
);
const brandExact = ['brand-exact', 'brand-exact-foreground'].map((role) => ({
	role,
	variant: 'DEFAULT',
	isDefault: true,
	value: '',
}));
const stylesheets = {
	'tailwind.css': formatPropertyAwareTailwind([...entries, ...brandExact], '-'),
	'tailwind-inverted.css': formatPropertyAwareTailwind(
		entries.map((entry) => withInvertedSuffix(entry, '-')),
		'-',
	),
};

for (const [file, css] of Object.entries(stylesheets)) {
	writeFileSync(join(root, file), `${css}\n`);
}

const biome = Bun.spawnSync(
	[
		process.execPath,
		'x',
		'biome',
		'format',
		'--write',
		...Object.keys(stylesheets),
	],
	{ cwd: root, stdout: 'inherit', stderr: 'inherit' },
);
if (!biome.success) process.exit(biome.exitCode);
