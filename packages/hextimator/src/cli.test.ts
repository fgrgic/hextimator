import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Mapping from every HextimateGenerationOptions key to its CLI flag.
 * When you add a new generation option, add it here — the test will
 * verify the flag exists in cli.ts and is documented in llms.txt.
 */
const GENERATION_OPTION_TO_CLI_FLAG: Record<string, string | null> = {
	baseColor: 'base-color',
	baseHueShift: 'base-hue-shift',
	hueShift: 'hue-shift',
	baseMaxChroma: 'base-max-chroma',
	foregroundMaxChroma: 'fg-max-chroma',
	light: 'light-lightness', // light.lightness exposed as --light-lightness
	dark: 'dark-lightness', // dark.lightness exposed as --dark-lightness
	minContrastRatio: 'min-contrast',
	invertDarkModeBaseAccent: 'invert-dark',
	semanticColors: 'positive', // exposed as --positive, --negative, --warning
	semanticColorRanges: null, // not exposed in CLI (advanced, rarely used)
};

/**
 * Mapping from every HextimateFormatOptions key to its CLI flag.
 */
const FORMAT_OPTION_TO_CLI_FLAG: Record<string, string | null> = {
	as: 'format',
	colors: 'colors',
	separator: 'separator',
	roleNames: null, // exposed only via presets in CLI
	variantNames: null, // exposed only via presets in CLI
};

/**
 * Builder methods that should be documented in llms.txt.
 */
const BUILDER_METHODS = [
	'addRole',
	'addVariant',
	'addToken',
	'preset',
	'light',
	'dark',
	'simulate',
	'adaptFor',
	'fork',
	'format',
];

const cliSource = readFileSync(resolve(__dirname, 'cli.ts'), 'utf-8');
const llmsTxt = readFileSync(resolve(__dirname, '../llms.txt'), 'utf-8');

function extractParseArgsOptions(source: string): string[] {
	const optionsBlock = source.match(/options:\s*\{([\s\S]*?)\}\s*,?\s*\}\);/);
	if (!optionsBlock) return [];
	const matches = optionsBlock[1].matchAll(/(?:'([^']+)'|(\w+)):\s*\{[^}]*\}/g);
	return [...matches].map((m) => m[1] ?? m[2]);
}

const cliFlags = extractParseArgsOptions(cliSource);

/** Meta flags that don't map to API options and don't need llms.txt docs */
const META_FLAGS = new Set(['help', 'version']);

describe('CLI ↔ API sync', () => {
	for (const [option, flag] of Object.entries(GENERATION_OPTION_TO_CLI_FLAG)) {
		if (flag === null) continue;
		test(`generation option "${option}" has CLI flag --${flag}`, () => {
			expect(cliFlags).toContain(flag);
		});
	}

	for (const [option, flag] of Object.entries(FORMAT_OPTION_TO_CLI_FLAG)) {
		if (flag === null) continue;
		test(`format option "${option}" has CLI flag --${flag}`, () => {
			expect(cliFlags).toContain(flag);
		});
	}
});

describe('llms.txt ↔ CLI sync', () => {
	for (const flag of cliFlags) {
		if (META_FLAGS.has(flag)) continue;
		test(`CLI flag --${flag} is documented in llms.txt`, () => {
			expect(llmsTxt).toContain(`--${flag}`);
		});
	}
});

describe('llms.txt ↔ builder sync', () => {
	for (const method of BUILDER_METHODS) {
		test(`builder method .${method}() is documented in llms.txt`, () => {
			expect(llmsTxt).toContain(`.${method}(`);
		});
	}
});
