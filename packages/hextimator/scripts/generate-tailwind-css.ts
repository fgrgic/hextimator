import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tailwindAliases } from '../src/tailwindAliases';
import { baseTheme } from '../src/theme';

const { accent, surface, ...roles } = baseTheme.roles;
const theme = { ...baseTheme, roles: { accent, surface, ...roles } };

writeFileSync(
	join(import.meta.dirname, '..', 'tailwind.css'),
	tailwindAliases(theme),
);
writeFileSync(
	join(import.meta.dirname, '..', 'tailwind-inverted.css'),
	tailwindAliases({ ...theme, tokens: [] }, { inverted: true }),
);
