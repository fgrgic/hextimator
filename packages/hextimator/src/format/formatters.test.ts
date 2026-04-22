import { describe, expect, it } from 'bun:test';
import {
	formatCSSStylesheet,
	formatJSON,
	formatObject,
	formatSCSS,
	formatTailwind,
	formatTailwindStylesheet,
} from './formatters';
import type { TokenEntry } from './types';

const lightEntries: TokenEntry[] = [
	{ role: 'surface', variant: 'DEFAULT', isDefault: true, value: '#ffffff' },
	{ role: 'surface', variant: 'strong', isDefault: false, value: '#cccccc' },
	{ role: 'accent', variant: 'DEFAULT', isDefault: true, value: '#0000ff' },
	{ role: 'accent', variant: 'weak', isDefault: false, value: '#8888ff' },
];

const darkEntries: TokenEntry[] = [
	{ role: 'surface', variant: 'DEFAULT', isDefault: true, value: '#111111' },
	{ role: 'surface', variant: 'strong', isDefault: false, value: '#333333' },
	{ role: 'accent', variant: 'DEFAULT', isDefault: true, value: '#6666ff' },
	{ role: 'accent', variant: 'weak', isDefault: false, value: '#4444aa' },
];

describe('formatObject', () => {
	it('collapses DEFAULT variant to just the role name', () => {
		const result = formatObject(lightEntries, '-');
		expect(result.surface).toBe('#ffffff');
	});

	it('combines role and variant with separator for non-DEFAULT', () => {
		const result = formatObject(lightEntries, '-');
		expect(result['surface-strong']).toBe('#cccccc');
	});

	it('respects custom separator', () => {
		const result = formatObject(lightEntries, '_');
		expect(result.surface_strong).toBe('#cccccc');
		expect(result.accent_weak).toBe('#8888ff');
	});

	it('includes all entries', () => {
		const result = formatObject(lightEntries, '-');
		expect(Object.keys(result)).toHaveLength(4);
	});
});

describe('formatSCSS', () => {
	it('prefixes keys with $', () => {
		const result = formatSCSS(lightEntries, '-');
		expect(result.$surface).toBe('#ffffff');
		expect(result['$surface-strong']).toBe('#cccccc');
	});

	it('does not include unprefixed keys', () => {
		const result = formatSCSS(lightEntries, '-');
		expect(result.surface).toBeUndefined();
	});
});

describe('formatTailwind', () => {
	it('produces a nested role → variant → value structure', () => {
		const result = formatTailwind(lightEntries);
		expect(result.surface.DEFAULT).toBe('#ffffff');
		expect(result.surface.strong).toBe('#cccccc');
		expect(result.accent.DEFAULT).toBe('#0000ff');
		expect(result.accent.weak).toBe('#8888ff');
	});

	it('groups all variants under their role', () => {
		const result = formatTailwind(lightEntries);
		expect(Object.keys(result.surface)).toEqual(['DEFAULT', 'strong']);
	});
});

describe('formatCSSStylesheet', () => {
	it('wraps light tokens in :root by default', () => {
		const css = formatCSSStylesheet(lightEntries, darkEntries, '-');
		expect(css).toContain(':root {');
		expect(css).toContain('--surface: #ffffff;');
		expect(css).toContain('--surface-strong: #cccccc;');
		expect(css).toContain('--accent: #0000ff;');
	});

	it('defaults to media dark-mode strategy', () => {
		const css = formatCSSStylesheet(lightEntries, darkEntries, '-');
		expect(css).toContain('@media (prefers-color-scheme: dark)');
		expect(css).toContain('--surface: #111111;');
	});

	it('omits dark block when darkMode is false', () => {
		const css = formatCSSStylesheet(lightEntries, darkEntries, '-', {
			darkMode: false,
		});
		expect(css).not.toContain('@media');
		expect(css).not.toContain('#111111');
		expect(css).toContain('--surface: #ffffff;');
	});

	it('class dark-mode uses .dark selector', () => {
		const css = formatCSSStylesheet(lightEntries, darkEntries, '-', {
			darkMode: 'class',
		});
		expect(css).not.toContain('@media');
		expect(css).toContain('.dark {');
		expect(css).toContain('--surface: #111111;');
	});

	it('data-attribute dark-mode uses [data-theme="dark"] selector', () => {
		const css = formatCSSStylesheet(lightEntries, darkEntries, '-', {
			darkMode: 'data-attribute',
		});
		expect(css).toContain('[data-theme="dark"] {');
		expect(css).toContain('--surface: #111111;');
	});

	it('respects custom selector', () => {
		const css = formatCSSStylesheet(lightEntries, darkEntries, '-', {
			selector: '[data-scope="a"]',
		});
		expect(css).toContain('[data-scope="a"] {');
		expect(css).not.toContain(':root {');
	});

	it('respects custom separator', () => {
		const css = formatCSSStylesheet(lightEntries, darkEntries, '_');
		expect(css).toContain('--surface_strong: #cccccc;');
	});
});

describe('formatTailwindStylesheet', () => {
	it('wraps light tokens in a single @theme block with --color- prefix', () => {
		const css = formatTailwindStylesheet(lightEntries, darkEntries, '-');
		expect(css).toContain('@theme {');
		expect(css).toContain('--color-surface: #ffffff;');
		expect(css).toContain('--color-surface-strong: #cccccc;');
		// only one @theme block — dark overrides go outside
		expect(css.match(/@theme/g) ?? []).toHaveLength(1);
	});

	it('defaults to media dark-mode with :root override', () => {
		const css = formatTailwindStylesheet(lightEntries, darkEntries, '-');
		expect(css).toContain('@media (prefers-color-scheme: dark)');
		expect(css).toContain('--color-surface: #111111;');
	});

	it('class dark-mode uses .dark for overrides', () => {
		const css = formatTailwindStylesheet(lightEntries, darkEntries, '-', {
			darkMode: 'class',
		});
		expect(css).toContain('.dark {');
		expect(css).toContain('--color-surface: #111111;');
	});

	it('omits dark overrides when darkMode is false', () => {
		const css = formatTailwindStylesheet(lightEntries, darkEntries, '-', {
			darkMode: false,
		});
		expect(css).not.toContain('@media');
		expect(css).not.toContain('.dark');
		expect(css).not.toContain('#111111');
	});
});

describe('formatJSON', () => {
	it('returns a valid JSON string', () => {
		const result = formatJSON(lightEntries, '-');
		expect(() => JSON.parse(result)).not.toThrow();
	});

	it('contains the expected keys and values', () => {
		const result = formatJSON(lightEntries, '-');
		const parsed = JSON.parse(result);
		expect(parsed.surface).toBe('#ffffff');
		expect(parsed['surface-strong']).toBe('#cccccc');
	});

	it('is pretty-printed (contains newlines)', () => {
		const result = formatJSON(lightEntries, '-');
		expect(result).toContain('\n');
	});
});
