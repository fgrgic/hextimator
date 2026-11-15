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

writeFileSync(
	join(root, 'tailwind.css'),
	`${formatPropertyAwareTailwind([...entries, ...brandExact], '-')}\n`,
);
writeFileSync(
	join(root, 'tailwind-inverted.css'),
	`${formatPropertyAwareTailwind(
		entries.map((entry) => withInvertedSuffix(entry, '-')),
		'-',
	)}\n`,
);
