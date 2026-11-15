import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	buildTokenEntries,
	withInvertedSuffix,
} from '../src/format/buildTokenEntries';
import { propertyUtilities } from '../src/format/propertyUtilities';
import { generate } from '../src/generate/generate';
import { propertyColors } from '../src/generate/propertyColors';
import { parse } from '../src/parse';

const root = join(import.meta.dirname, '..');
const palette = propertyColors(
	generate(parse('#737373'), 'light'),
	'light',
	{},
);
const entries = buildTokenEntries(palette);
for (const inverted of [false, true]) {
	const suffix = inverted ? '-inverted' : '';
	const legacy = readFileSync(
		join(root, `tailwind-legacy${suffix}.css`),
		'utf8',
	);
	const aliases = legacy
		.split('\n')
		.filter(
			(line) =>
				!/^\s*--color-(accent|positive|negative|caution)(-strong|-weak)?(-inverted)?:/.test(
					line,
				),
		)
		.join('\n');
	const tokens = inverted
		? entries.map((entry) => withInvertedSuffix(entry, '-'))
		: entries;
	writeFileSync(
		join(root, `tailwind${suffix}.css`),
		`${aliases}\n${propertyUtilities(tokens)}\n`,
	);
}
