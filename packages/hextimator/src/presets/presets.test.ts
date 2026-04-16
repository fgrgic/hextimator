import { describe, expect, test } from 'bun:test';
import { hextimate } from '../index';
import { shadcn } from './shadcn';
import type { HextimatePreset } from './types';

describe('preset', () => {
	test('applies format defaults from preset', () => {
		const theme = hextimate('#6366F1').preset(shadcn).format();

		// shadcn preset sets as: 'css', so keys should be CSS custom properties
		expect(theme.light).toHaveProperty('--primary');
		expect(theme.light).toHaveProperty('--background');
		expect(theme.dark).toHaveProperty('--primary');
		expect(theme.dark).toHaveProperty('--background');
	});

	test('shadcn preset produces all expected variables', () => {
		const theme = hextimate('#6366F1').preset(shadcn).format();
		const lightKeys = Object.keys(theme.light);

		// Core shadcn variables
		const expectedKeys = [
			'--background',
			'--background-foreground',
			'--primary',
			'--primary-foreground',
			'--destructive',
			'--destructive-foreground',
			'--foreground',
			'--card',
			'--card-foreground',
			'--popover',
			'--popover-foreground',
			'--secondary',
			'--secondary-foreground',
			'--muted',
			'--muted-foreground',
			'--accent',
			'--accent-foreground',
			'--border',
			'--input',
			'--ring',
		];

		for (const key of expectedKeys) {
			expect(lightKeys).toContain(key);
		}
	});

	test('shadcn preset uses oklch color format', () => {
		const theme = hextimate('#6366F1').preset(shadcn).format();

		const primaryValue = (theme.light as Record<string, string>)['--primary'];
		expect(primaryValue).toMatch(/^oklch\(/);
	});

	test('format options override preset defaults', () => {
		const theme = hextimate('#6366F1').preset(shadcn).format({ colors: 'hex' });

		const primaryValue = (theme.light as Record<string, string>)['--primary'];
		expect(primaryValue).toMatch(/^#/);
	});

	test('format as option overrides preset as', () => {
		const theme = hextimate('#6366F1').preset(shadcn).format({ as: 'object' });

		// object format uses bare keys (no --)
		expect(theme.light).toHaveProperty('background');
		expect(theme.light).not.toHaveProperty('--background');
	});

	test('roleNames merge between preset and format call', () => {
		const theme = hextimate('#6366F1')
			.preset(shadcn)
			.format({ roleNames: { warning: 'caution' } });

		const lightKeys = Object.keys(theme.light);
		// shadcn's renaming still applies
		expect(lightKeys).toContain('--primary');
		expect(lightKeys).toContain('--background');
		// user's override also applies
		expect(lightKeys).toContain('--caution');
		expect(lightKeys).not.toContain('--warning');
	});

	test('fork preserves preset', () => {
		const builder = hextimate('#6366F1').preset(shadcn);
		const forked = builder.fork('#ff6600');
		const theme = forked.format();

		// Forked builder should have the same preset applied
		expect(theme.light).toHaveProperty('--primary');
		expect(theme.light).toHaveProperty('--background');
		expect(theme.light).toHaveProperty('--foreground');
		expect(theme.light).toHaveProperty('--ring');
	});

	test('fork does not double-apply preset tokens', () => {
		const builder = hextimate('#6366F1').preset(shadcn);
		const forked = builder.fork('#ff6600');
		const theme = forked.format();

		// Count occurrences of standalone token keys — should not be duplicated
		const lightKeys = Object.keys(theme.light);
		const ringCount = lightKeys.filter((k) => k === '--ring').length;
		expect(ringCount).toBe(1);
	});

	test('fork of fork preserves preset without duplication', () => {
		const original = hextimate('#6366F1').preset(shadcn);
		const fork1 = original.fork('#ff6600');
		const fork2 = fork1.fork('#00cc88');
		const theme = fork2.format();

		const lightKeys = Object.keys(theme.light);
		const ringCount = lightKeys.filter((k) => k === '--ring').length;
		expect(ringCount).toBe(1);

		expect(lightKeys).toContain('--primary');
		expect(lightKeys).toContain('--foreground');
	});

	test('regenerate preserves preset (via light/dark options)', () => {
		const theme = hextimate('#6366F1', { light: { lightness: 0.8 } })
			.preset(shadcn)
			.format();

		expect(theme.light).toHaveProperty('--primary');
		expect(theme.light).toHaveProperty('--foreground');
		expect(theme.light).toHaveProperty('--ring');
	});

	test('preset can be combined with addRole/addToken', () => {
		const theme = hextimate('#6366F1')
			.preset(shadcn)
			.addRole('cta', '#ee2244')
			.addToken('logo', '#000000')
			.format();

		const lightKeys = Object.keys(theme.light);
		expect(lightKeys).toContain('--cta');
		expect(lightKeys).toContain('--logo');
		// shadcn tokens still present
		expect(lightKeys).toContain('--primary');
	});

	test('custom preset with roles', () => {
		const custom: HextimatePreset = {
			roles: [{ name: 'cta', color: '#ee2244' }],
			format: { as: 'css' },
		};

		const theme = hextimate('#6366F1').preset(custom).format();
		const lightKeys = Object.keys(theme.light);

		expect(lightKeys).toContain('--cta');
		expect(lightKeys).toContain('--cta-strong');
		expect(lightKeys).toContain('--cta-weak');
		expect(lightKeys).toContain('--cta-foreground');
	});

	test('custom preset with variants', () => {
		const custom: HextimatePreset = {
			variants: [{ name: 'hover', placement: { from: 'strong' } }],
			format: { as: 'object' },
		};

		const theme = hextimate('#6366F1').preset(custom).format();
		expect(theme.light).toHaveProperty('accent-hover');
		expect(theme.light).toHaveProperty('base-hover');
	});

	test('preset values are independent across themes', () => {
		const theme = hextimate('#6366F1').preset(shadcn).format();

		const lightBorder = (theme.light as Record<string, string>)['--border'];
		const darkBorder = (theme.dark as Record<string, string>)['--border'];

		// Border should be different in light vs dark
		expect(lightBorder).not.toBe(darkBorder);
	});
});

describe('preset chaining', () => {
	test('style preset + framework preset produces both effects', () => {
		const muted: HextimatePreset = {
			generation: { light: { maxChroma: 0.06 }, dark: { maxChroma: 0.05 } },
		};

		const theme = hextimate('#6366F1').preset(muted).preset(shadcn).format();

		// shadcn tokens present
		expect(theme.light).toHaveProperty('--primary');
		expect(theme.light).toHaveProperty('--background');
		expect(theme.light).toHaveProperty('--ring');

		// muted generation applied (chroma is lower than default)
		const defaultTheme = hextimate('#6366F1').preset(shadcn).format();
		const mutedPrimary = (theme.light as Record<string, string>)['--primary'];
		const defaultPrimary = (defaultTheme.light as Record<string, string>)[
			'--primary'
		];
		expect(mutedPrimary).not.toBe(defaultPrimary);
	});

	test('second preset generation deep-merges with first', () => {
		const presetA: HextimatePreset = {
			generation: {
				light: { maxChroma: 0.06 },
				baseMaxChroma: 0.03,
			},
		};
		const presetB: HextimatePreset = {
			generation: {
				light: { lightness: 0.8 },
			},
		};

		// A sets light.maxChroma + baseMaxChroma, B sets light.lightness
		// After chaining, all three should be active
		const chained = hextimate('#6366F1')
			.preset(presetA)
			.preset(presetB)
			.format({ as: 'object' });

		const onlyA = hextimate('#6366F1').preset(presetA).format({ as: 'object' });
		const onlyB = hextimate('#6366F1').preset(presetB).format({ as: 'object' });

		// Result should differ from both individual presets
		const chainedAccent = (chained.light as Record<string, string>)['accent'];
		const aAccent = (onlyA.light as Record<string, string>)['accent'];
		const bAccent = (onlyB.light as Record<string, string>)['accent'];
		expect(chainedAccent).not.toBe(aAccent);
		expect(chainedAccent).not.toBe(bAccent);
	});

	test('later preset overrides earlier preset for same key', () => {
		const presetA: HextimatePreset = {
			generation: { baseMaxChroma: 0.03 },
		};
		const presetB: HextimatePreset = {
			generation: { baseMaxChroma: 0.08 },
		};

		const abTheme = hextimate('#6366F1')
			.preset(presetA)
			.preset(presetB)
			.format({ as: 'object' });

		const bOnlyTheme = hextimate('#6366F1')
			.preset(presetB)
			.format({ as: 'object' });

		// A then B should produce same result as just B for the conflicting key
		expect((abTheme.light as Record<string, string>)['base']).toBe(
			(bOnlyTheme.light as Record<string, string>)['base'],
		);
	});

	test('constructor options override all presets', () => {
		const presetA: HextimatePreset = {
			generation: { baseMaxChroma: 0.03 },
		};
		const presetB: HextimatePreset = {
			generation: { baseMaxChroma: 0.08 },
		};

		const theme = hextimate('#6366F1', { baseMaxChroma: 0.01 })
			.preset(presetA)
			.preset(presetB)
			.format({ as: 'object' });

		const userOnlyTheme = hextimate('#6366F1', { baseMaxChroma: 0.01 }).format({
			as: 'object',
		});

		// User's value (0.01) should win over both presets
		expect((theme.light as Record<string, string>)['base']).toBe(
			(userOnlyTheme.light as Record<string, string>)['base'],
		);
	});

	test('chained presets concatenate tokens', () => {
		const presetA: HextimatePreset = {
			tokens: [{ name: 'surface', value: { from: 'base.weak' } }],
			format: { as: 'object' },
		};
		const presetB: HextimatePreset = {
			tokens: [{ name: 'ring', value: { from: 'accent' } }],
		};

		const theme = hextimate('#6366F1').preset(presetA).preset(presetB).format();

		// Both tokens present
		expect(theme.light).toHaveProperty('surface');
		expect(theme.light).toHaveProperty('ring');
	});

	test('chained presets merge format options', () => {
		const presetA: HextimatePreset = {
			format: {
				as: 'css',
				roleNames: { base: 'bg' },
			},
		};
		const presetB: HextimatePreset = {
			format: {
				colors: 'hex',
				roleNames: { accent: 'brand' },
			},
		};

		const theme = hextimate('#6366F1').preset(presetA).preset(presetB).format();

		const keys = Object.keys(theme.light);
		// presetA's roleNames
		expect(keys).toContain('--bg');
		// presetB's roleNames
		expect(keys).toContain('--brand');
		// presetB's color format
		const bgValue = (theme.light as Record<string, string>)['--bg'];
		expect(bgValue).toMatch(/^#/);
	});

	test('chained presets concatenate roles', () => {
		const presetA: HextimatePreset = {
			roles: [{ name: 'info', color: '#0288d1' }],
		};
		const presetB: HextimatePreset = {
			roles: [{ name: 'cta', color: '#ee2244' }],
		};

		const theme = hextimate('#6366F1')
			.preset(presetA)
			.preset(presetB)
			.format({ as: 'object' });

		expect(theme.light).toHaveProperty('info');
		expect(theme.light).toHaveProperty('cta');
	});

	test('fork preserves chained presets', () => {
		const muted: HextimatePreset = {
			generation: { light: { maxChroma: 0.06 } },
		};

		const builder = hextimate('#6366F1').preset(muted).preset(shadcn);
		const forked = builder.fork('#ff6600');
		const theme = forked.format();

		expect(theme.light).toHaveProperty('--primary');
		expect(theme.light).toHaveProperty('--ring');
	});
});
