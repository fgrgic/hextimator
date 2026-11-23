import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
	baseTheme,
	hextimate,
	type ThemeDefinition,
	tailwindAliases,
} from './index';

function declarations(css: string): string[] {
	return css
		.replace(/^\/\*.*?\*\/\n/, '')
		.replace(/\s+/g, '')
		.replace(/^@themeinline\{|\}$/g, '')
		.split(';')
		.filter(Boolean)
		.sort();
}

test('matches the shipped default aliases', () => {
	const normal = readFileSync(
		new URL('../tailwind.css', import.meta.url),
		'utf8',
	);
	const inverted = readFileSync(
		new URL('../tailwind-inverted.css', import.meta.url),
		'utf8',
	);

	expect(declarations(tailwindAliases(baseTheme))).toEqual(
		declarations(normal),
	);
	expect(declarations(tailwindAliases(baseTheme, { inverted: true }))).toEqual(
		declarations(inverted),
	);
});

test('matches formatted custom token names in both modes', () => {
	const theme = {
		...baseTheme,
		roles: { ...baseTheme.roles, action: { color: '#f60' } },
		variants: [{ name: 'hover', placement: { from: 'strong' } }],
		variantNames: { DEFAULT: 'main', foreground: 'text' },
		tokens: [{ name: 'button', value: { from: 'action.hover' } }],
		format: {
			separator: '_',
			keyPrefix: '--app-',
			roleNames: { action: 'cta' },
			excludeRoles: ['caution'],
			excludeVariants: ['weak'],
		},
	} satisfies ThemeDefinition;
	const palette = hextimate('#f60', theme).format({
		as: 'object',
		invertedVariants: true,
	});
	const aliases = [
		...declarations(tailwindAliases(theme)),
		...declarations(tailwindAliases(theme, { inverted: true })),
	].sort();

	for (const tokens of [palette.light, palette.dark]) {
		expect(aliases).toEqual(
			Object.keys(tokens)
				.map((key) => `--color-${key.slice(2)}:var(${key})`)
				.sort(),
		);
	}
});

test('matches CSS output and object output for a theme with CSS defaults', () => {
	const theme = {
		...baseTheme,
		format: { as: 'css', keyPrefix: 'app-' },
	} satisfies ThemeDefinition;
	const builder = hextimate('#f60', theme);
	const overrides = { separator: '_', roleNames: { accent: 'primary' } };
	const css = builder.format({ ...overrides, as: 'css', theme: 'light' });
	const cssKeys = Array.from(
		css.matchAll(/^ {2}--([^:]+):/gm),
		(match) => match[1],
	);
	expect(declarations(tailwindAliases(theme, overrides))).toEqual(
		cssKeys.map((key) => `--color-${key}:var(--${key})`).sort(),
	);

	const { light } = builder.format({ ...overrides, as: 'object' });
	expect(
		declarations(tailwindAliases(theme, { ...overrides, as: 'object' })),
	).toEqual(
		Object.keys(light)
			.map((key) => `--color-${key}:var(--${key})`)
			.sort(),
	);
});

test('requires an explicit runtime format for themes that emit Tailwind colors', () => {
	const theme = {
		...baseTheme,
		format: { as: 'tailwind-css' },
	} satisfies ThemeDefinition;
	expect(() => tailwindAliases(theme)).toThrow('object or css runtime output');
	expect(tailwindAliases(theme, { as: 'object' })).toBe(
		tailwindAliases(baseTheme),
	);
});
