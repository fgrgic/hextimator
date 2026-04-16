import { describe, expect, it } from 'bun:test';
import { generate } from '../generate';
import type { RGB } from '../types';
import { format } from './format';

const blue: RGB = { space: 'srgb', r: 59, g: 130, b: 246, alpha: 1 };

// Use a real generated palette as the fixture so tests reflect actual usage.
const palette = generate(blue, 'light');
if (!palette) throw new Error('generate returned null');

describe('format() — default (no options)', () => {
	it('returns a flat object', () => {
		const result = format(palette);
		expect(typeof result).toBe('object');
		expect(typeof result).not.toBe('string');
	});

	it("uses '-' separator by default", () => {
		const result = format(palette) as Record<string, string>;
		expect(Object.keys(result).some((k) => k.includes('-'))).toBe(true);
	});

	it('collapses DEFAULT variant to just the role name', () => {
		const result = format(palette) as Record<string, string>;
		expect(result.base).toBeDefined();
		expect(result.accent).toBeDefined();
	});

	it('includes non-DEFAULT variants as role-variant keys', () => {
		const result = format(palette) as Record<string, string>;
		expect(result['base-strong']).toBeDefined();
		expect(result['base-weak']).toBeDefined();
		expect(result['base-foreground']).toBeDefined();
	});
});

describe('format() — css', () => {
	it('prefixes all keys with --', () => {
		const result = format(palette, { as: 'css' }) as Record<string, string>;
		expect(Object.keys(result).every((k) => k.startsWith('--'))).toBe(true);
	});

	it('includes --base and --base-strong', () => {
		const result = format(palette, { as: 'css' }) as Record<string, string>;
		expect(result['--base']).toBeDefined();
		expect(result['--base-strong']).toBeDefined();
	});
});

describe('format() — scss', () => {
	it('prefixes all keys with $', () => {
		const result = format(palette, { as: 'scss' }) as Record<string, string>;
		expect(Object.keys(result).every((k) => k.startsWith('$'))).toBe(true);
	});
});

describe('format() — tailwind', () => {
	it('returns a nested object', () => {
		const result = format(palette, { as: 'tailwind' }) as Record<
			string,
			Record<string, string>
		>;
		expect(typeof result.base).toBe('object');
		expect(result.base.DEFAULT).toBeDefined();
		expect(result.base.strong).toBeDefined();
	});

	it('groups all five roles at the top level', () => {
		const result = format(palette, { as: 'tailwind' }) as Record<
			string,
			unknown
		>;
		expect(result.base).toBeDefined();
		expect(result.accent).toBeDefined();
		expect(result.positive).toBeDefined();
		expect(result.negative).toBeDefined();
		expect(result.warning).toBeDefined();
	});
});

describe('format() — json', () => {
	it('returns a string', () => {
		expect(typeof format(palette, { as: 'json' })).toBe('string');
	});

	it('is valid JSON', () => {
		const result = format(palette, { as: 'json' }) as string;
		expect(() => JSON.parse(result)).not.toThrow();
	});

	it('contains base and base-strong keys', () => {
		const result = JSON.parse(format(palette, { as: 'json' }) as string);
		expect(result.base).toBeDefined();
		expect(result['base-strong']).toBeDefined();
	});
});

describe('format() — options', () => {
	it('respects custom separator', () => {
		const result = format(palette, { separator: '_' }) as Record<
			string,
			string
		>;
		expect(result.base_strong).toBeDefined();
		expect(result['base-strong']).toBeUndefined();
	});

	it('respects roleNames overrides', () => {
		const result = format(palette, {
			roleNames: { base: 'surface' },
		}) as Record<string, string>;
		expect(result.surface).toBeDefined();
		expect(result.base).toBeUndefined();
	});

	it('respects variantNames overrides', () => {
		const result = format(palette, {
			variantNames: { strong: 'dark' },
		}) as Record<string, string>;
		expect(result['base-dark']).toBeDefined();
		expect(result['base-strong']).toBeUndefined();
	});

	it('respects colors: rgb', () => {
		const result = format(palette, { colors: 'rgb' }) as Record<string, string>;
		expect(Object.values(result).every((v) => v.startsWith('rgb('))).toBe(true);
	});

	it('respects colors: oklch', () => {
		const result = format(palette, { colors: 'oklch' }) as Record<
			string,
			string
		>;
		expect(Object.values(result).every((v) => v.startsWith('oklch('))).toBe(
			true,
		);
	});

	it('respects colors: p3', () => {
		const result = format(palette, { colors: 'p3' }) as Record<string, string>;
		expect(
			Object.values(result).every((v) => v.startsWith('color(display-p3 ')),
		).toBe(true);
	});

	it('excludeRoles omits the specified roles', () => {
		const result = format(palette, {
			excludeRoles: ['warning', 'positive'],
		}) as Record<string, string>;
		expect(Object.keys(result).some((k) => k === 'warning' || k.startsWith('warning-'))).toBe(false);
		expect(Object.keys(result).some((k) => k === 'positive' || k.startsWith('positive-'))).toBe(false);
		expect(result.base).toBeDefined();
		expect(result.accent).toBeDefined();
	});

	it('excludeVariants omits the specified variants from all roles', () => {
		const result = format(palette, {
			excludeVariants: ['strong', 'weak'],
		}) as Record<string, string>;
		expect(Object.keys(result).some((k) => k.endsWith('-strong'))).toBe(false);
		expect(Object.keys(result).some((k) => k.endsWith('-weak'))).toBe(false);
		expect(result.base).toBeDefined();
		expect(result['base-foreground']).toBeDefined();
	});

	it('excludeRoles and excludeVariants can be combined', () => {
		const result = format(palette, {
			excludeRoles: ['negative'],
			excludeVariants: ['strong'],
		}) as Record<string, string>;
		expect(Object.keys(result).some((k) => k === 'negative' || k.startsWith('negative-'))).toBe(false);
		expect(Object.keys(result).some((k) => k.endsWith('-strong'))).toBe(false);
		expect(result.base).toBeDefined();
		expect(result['base-weak']).toBeDefined();
	});
});
