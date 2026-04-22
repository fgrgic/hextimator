import { describe, expect, test } from 'bun:test';
import { hextimate } from '../index';
import { shadcn } from './shadcn';
import type { HextimatePreset } from './types';

function objectTheme(
	builder: ReturnType<typeof hextimate>,
	extra: Record<string, unknown> = {},
) {
	return builder.format({ as: 'object', ...extra }) as {
		light: Record<string, string>;
		dark: Record<string, string>;
	};
}

describe('preset', () => {
	test('applies format defaults from preset', () => {
		// shadcn preset sets as: 'css' → stylesheet string
		const css = hextimate('#6366F1').preset(shadcn).format();
		expect(typeof css).toBe('string');
		expect(css).toContain('--primary:');
		expect(css).toContain('--background:');
		// dark tokens land under the @media wrapper by default
		expect(css).toContain('@media (prefers-color-scheme: dark)');
	});

	test('shadcn preset produces all expected variables', () => {
		// Inspect the palette shape via as: 'object' (bare keys, no --)
		const theme = objectTheme(hextimate('#6366F1').preset(shadcn));
		const expectedKeys = [
			'background',
			'background-foreground',
			'primary',
			'primary-foreground',
			'destructive',
			'destructive-foreground',
			'foreground',
			'card',
			'card-foreground',
			'popover',
			'popover-foreground',
			'secondary',
			'secondary-foreground',
			'muted',
			'muted-foreground',
			'accent',
			'accent-foreground',
			'border',
			'input',
			'ring',
		];

		for (const key of expectedKeys) {
			expect(theme.light).toHaveProperty(key);
		}
	});

	test('shadcn preset uses oklch color format', () => {
		const theme = objectTheme(hextimate('#6366F1').preset(shadcn));
		expect(theme.light.primary).toMatch(/^oklch\(/);
	});

	test('format options override preset defaults', () => {
		const theme = objectTheme(hextimate('#6366F1').preset(shadcn), {
			colors: 'hex',
		});
		expect(theme.light.primary).toMatch(/^#/);
	});

	test('format as option overrides preset as', () => {
		const theme = objectTheme(hextimate('#6366F1').preset(shadcn));
		// object format uses bare keys (no --)
		expect(theme.light).toHaveProperty('background');
	});

	test('roleNames merge between preset and format call', () => {
		const theme = objectTheme(hextimate('#6366F1').preset(shadcn), {
			roleNames: { accent: 'brand' },
		});
		// shadcn's renaming still applies for other roles
		expect(theme.light).toHaveProperty('background');
		// user's override takes precedence over the preset's rename
		expect(theme.light).toHaveProperty('brand');
		expect(theme.light).not.toHaveProperty('primary');
	});

	test('fork preserves preset', () => {
		const builder = hextimate('#6366F1').preset(shadcn);
		const theme = objectTheme(builder.fork('#ff6600'));

		expect(theme.light).toHaveProperty('primary');
		expect(theme.light).toHaveProperty('background');
		expect(theme.light).toHaveProperty('foreground');
		expect(theme.light).toHaveProperty('ring');
	});

	test('fork does not double-apply preset tokens', () => {
		const builder = hextimate('#6366F1').preset(shadcn);
		const theme = objectTheme(builder.fork('#ff6600'));

		const ringCount = Object.keys(theme.light).filter(
			(k) => k === 'ring',
		).length;
		expect(ringCount).toBe(1);
	});

	test('fork of fork preserves preset without duplication', () => {
		const original = hextimate('#6366F1').preset(shadcn);
		const fork1 = original.fork('#ff6600');
		const fork2 = fork1.fork('#00cc88');
		const theme = objectTheme(fork2);

		const ringCount = Object.keys(theme.light).filter(
			(k) => k === 'ring',
		).length;
		expect(ringCount).toBe(1);

		expect(theme.light).toHaveProperty('primary');
		expect(theme.light).toHaveProperty('foreground');
	});

	test('regenerate preserves preset (via light/dark options)', () => {
		const theme = objectTheme(
			hextimate('#6366F1')
				.style({ light: { lightness: 0.8 } })
				.preset(shadcn),
		);

		expect(theme.light).toHaveProperty('primary');
		expect(theme.light).toHaveProperty('foreground');
		expect(theme.light).toHaveProperty('ring');
	});

	test('preset can be combined with addRole/addToken', () => {
		const theme = objectTheme(
			hextimate('#6366F1')
				.preset(shadcn)
				.addRole('cta', '#ee2244')
				.addToken('logo', '#000000'),
		);

		expect(theme.light).toHaveProperty('cta');
		expect(theme.light).toHaveProperty('logo');
		expect(theme.light).toHaveProperty('primary');
	});

	test('custom preset with roles', () => {
		const custom: HextimatePreset = {
			roles: [{ name: 'cta', color: '#ee2244' }],
			format: { as: 'css' },
		};

		// Override as: 'object' so we can inspect the palette shape
		const theme = objectTheme(hextimate('#6366F1').preset(custom));
		expect(theme.light).toHaveProperty('cta');
		expect(theme.light).toHaveProperty('cta-strong');
		expect(theme.light).toHaveProperty('cta-weak');
		expect(theme.light).toHaveProperty('cta-foreground');
	});

	test('custom preset with variants', () => {
		const custom: HextimatePreset = {
			variants: [{ name: 'hover', placement: { from: 'strong' } }],
			format: { as: 'object' },
		};

		const theme = hextimate('#6366F1').preset(custom).format() as {
			light: Record<string, string>;
		};
		expect(theme.light).toHaveProperty('accent-hover');
		expect(theme.light).toHaveProperty('surface-hover');
	});

	test('preset values are independent across themes', () => {
		const theme = objectTheme(hextimate('#6366F1').preset(shadcn));
		// Border should be different in light vs dark
		expect(theme.light.border).not.toBe(theme.dark.border);
	});
});

describe('preset chaining', () => {
	test('style preset + framework preset produces both effects', () => {
		const muted: HextimatePreset = {
			style: { light: { maxChroma: 0.06 }, dark: { maxChroma: 0.05 } },
		};

		const theme = objectTheme(
			hextimate('#6366F1').preset(muted).preset(shadcn),
		);

		// shadcn tokens present
		expect(theme.light).toHaveProperty('primary');
		expect(theme.light).toHaveProperty('background');
		expect(theme.light).toHaveProperty('ring');

		// muted style applied (chroma is lower than default)
		const defaultTheme = objectTheme(hextimate('#6366F1').preset(shadcn));
		expect(theme.light.primary).not.toBe(defaultTheme.light.primary);
	});

	test('second preset style deep-merges with first', () => {
		const presetA: HextimatePreset = {
			style: {
				light: { maxChroma: 0.06 },
				surfaceMaxChroma: 0.03,
			},
		};
		const presetB: HextimatePreset = {
			style: {
				light: { lightness: 0.8 },
			},
		};

		const chained = objectTheme(
			hextimate('#6366F1').preset(presetA).preset(presetB),
		);
		const onlyA = objectTheme(hextimate('#6366F1').preset(presetA));
		const onlyB = objectTheme(hextimate('#6366F1').preset(presetB));

		expect(chained.light.accent).not.toBe(onlyA.light.accent);
		expect(chained.light.accent).not.toBe(onlyB.light.accent);
	});

	test('later preset overrides earlier preset for same key', () => {
		const presetA: HextimatePreset = { style: { surfaceMaxChroma: 0.03 } };
		const presetB: HextimatePreset = { style: { surfaceMaxChroma: 0.08 } };

		const abTheme = objectTheme(
			hextimate('#6366F1').preset(presetA).preset(presetB),
		);
		const bOnlyTheme = objectTheme(hextimate('#6366F1').preset(presetB));

		expect(abTheme.light.surface).toBe(bOnlyTheme.light.surface);
	});

	test('style() after presets overrides preset style for the same key', () => {
		const presetA: HextimatePreset = { style: { surfaceMaxChroma: 0.03 } };
		const presetB: HextimatePreset = { style: { surfaceMaxChroma: 0.08 } };

		const theme = objectTheme(
			hextimate('#6366F1')
				.preset(presetA)
				.preset(presetB)
				.style({ surfaceMaxChroma: 0.01 }),
		);

		const userOnlyTheme = objectTheme(
			hextimate('#6366F1').style({ surfaceMaxChroma: 0.01 }),
		);

		expect(theme.light.surface).toBe(userOnlyTheme.light.surface);
	});

	test('chained presets concatenate tokens', () => {
		const presetA: HextimatePreset = {
			tokens: [{ name: 'surface', value: { from: 'surface.weak' } }],
			format: { as: 'object' },
		};
		const presetB: HextimatePreset = {
			tokens: [{ name: 'ring', value: { from: 'accent' } }],
		};

		const theme = hextimate('#6366F1')
			.preset(presetA)
			.preset(presetB)
			.format() as { light: Record<string, string> };

		expect(theme.light).toHaveProperty('surface');
		expect(theme.light).toHaveProperty('ring');
	});

	test('chained presets merge format options', () => {
		const presetA: HextimatePreset = {
			format: { as: 'css', roleNames: { surface: 'bg' } },
		};
		const presetB: HextimatePreset = {
			format: { colors: 'hex', roleNames: { accent: 'brand' } },
		};

		// Preserve preset's `as: 'css'` from presetA; override with 'object'
		// so we can inspect renamed role keys directly.
		const theme = objectTheme(
			hextimate('#6366F1').preset(presetA).preset(presetB),
		);

		// presetA's roleNames
		expect(theme.light).toHaveProperty('bg');
		// presetB's roleNames
		expect(theme.light).toHaveProperty('brand');
		// presetB's color format
		expect(theme.light.bg).toMatch(/^#/);
	});

	test('chained presets concatenate roles', () => {
		const presetA: HextimatePreset = {
			roles: [{ name: 'info', color: '#0288d1' }],
		};
		const presetB: HextimatePreset = {
			roles: [{ name: 'cta', color: '#ee2244' }],
		};

		const theme = objectTheme(
			hextimate('#6366F1').preset(presetA).preset(presetB),
		);

		expect(theme.light).toHaveProperty('info');
		expect(theme.light).toHaveProperty('cta');
	});

	test('fork preserves chained presets', () => {
		const muted: HextimatePreset = {
			style: { light: { maxChroma: 0.06 } },
		};

		const builder = hextimate('#6366F1').preset(muted).preset(shadcn);
		const theme = objectTheme(builder.fork('#ff6600'));

		expect(theme.light).toHaveProperty('primary');
		expect(theme.light).toHaveProperty('ring');
	});
});
