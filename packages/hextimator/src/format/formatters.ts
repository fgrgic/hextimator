import type { FlatTokenMap, NestedTokenMap, TokenEntry } from './types';

function toFlatKey(entry: TokenEntry, sep: string): string {
	if (entry.isDefault && entry.variant === 'DEFAULT') return entry.role;
	return `${entry.role}${sep}${entry.variant}`;
}

export function formatObject(entries: TokenEntry[], sep: string): FlatTokenMap {
	const result: FlatTokenMap = {};
	for (const entry of entries) {
		result[toFlatKey(entry, sep)] = entry.value;
	}
	return result;
}

export function formatSCSS(entries: TokenEntry[], sep: string): FlatTokenMap {
	const result: FlatTokenMap = {};
	for (const entry of entries) {
		result[`$${toFlatKey(entry, sep)}`] = entry.value;
	}
	return result;
}

export function formatTailwind(entries: TokenEntry[]): NestedTokenMap {
	const result: NestedTokenMap = {};
	for (const { role, variant, value } of entries) {
		if (!result[role]) result[role] = {};
		result[role][variant] = value;
	}
	return result;
}

export function formatJSON(entries: TokenEntry[], sep: string): string {
	return JSON.stringify(formatObject(entries, sep), null, 2);
}

export type StylesheetDarkMode = 'media' | 'class' | 'data-attribute' | false;

export interface StylesheetOptions {
	selector?: string;
	darkMode?: StylesheetDarkMode;
}

function declsFromEntries(
	entries: TokenEntry[],
	sep: string,
	prefix: string,
	indent: string,
): string {
	return entries
		.map((e) => `${indent}${prefix}${toFlatKey(e, sep)}: ${e.value};`)
		.join('\n');
}

function darkSelectorFor(
	mode: Exclude<StylesheetDarkMode, 'media' | false>,
): string {
	return mode === 'class' ? '.dark' : '[data-theme="dark"]';
}

export function formatCSSStylesheet(
	lightEntries: TokenEntry[],
	darkEntries: TokenEntry[],
	sep: string,
	opts: StylesheetOptions = {},
): string {
	const selector = opts.selector ?? ':root';
	const darkMode: StylesheetDarkMode = opts.darkMode ?? 'media';

	const lightBlock = `${selector} {\n${declsFromEntries(lightEntries, sep, '--', '  ')}\n}`;

	if (darkMode === false) return lightBlock;

	if (darkMode === 'media') {
		const darkInner = declsFromEntries(darkEntries, sep, '--', '    ');
		return `${lightBlock}\n@media (prefers-color-scheme: dark) {\n  ${selector} {\n${darkInner}\n  }\n}`;
	}

	const darkSel = darkSelectorFor(darkMode);
	const darkBlock = `${darkSel} {\n${declsFromEntries(darkEntries, sep, '--', '  ')}\n}`;
	return `${lightBlock}\n${darkBlock}`;
}

export function formatTailwindStylesheet(
	lightEntries: TokenEntry[],
	darkEntries: TokenEntry[],
	sep: string,
	opts: StylesheetOptions = {},
): string {
	const darkMode: StylesheetDarkMode = opts.darkMode ?? 'media';

	const theme = `@theme {\n${declsFromEntries(lightEntries, sep, '--color-', '  ')}\n}`;

	if (darkMode === false) return theme;

	if (darkMode === 'media') {
		const darkInner = declsFromEntries(darkEntries, sep, '--color-', '    ');
		return `${theme}\n@media (prefers-color-scheme: dark) {\n  :root {\n${darkInner}\n  }\n}`;
	}

	const darkSel = darkSelectorFor(darkMode);
	const darkBlock = `${darkSel} {\n${declsFromEntries(darkEntries, sep, '--color-', '  ')}\n}`;
	return `${theme}\n${darkBlock}`;
}
