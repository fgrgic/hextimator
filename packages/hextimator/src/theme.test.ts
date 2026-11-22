import { describe, expect, test } from 'bun:test';
import { baseTheme, hextimate, type ThemeDefinition } from './index';

type Tokens = { light: Record<string, string>; dark: Record<string, string> };

const objectTheme = (accent: string, theme?: ThemeDefinition) =>
	hextimate(accent, theme).format({ as: 'object' }) as Tokens;

const { positive, negative, caution, ...brandRoles } = baseTheme.roles;

const customTheme = {
	...baseTheme,
	style: {
		minContrastRatio: 'AA',
		surfaceHueShift: 160,
		surfaceMaxChroma: 0.025,
	},
	roles: {
		...brandRoles,
		success: positive,
		danger: negative,
		warning: caution,
		cta: { color: '#ee2244' },
	},
	variants: [{ name: 'hover', placement: { from: 'strong' } }],
	tokens: [
		...baseTheme.tokens,
		{ name: 'button-bg', value: { from: 'accent' } },
		{ name: 'button-hover', value: { from: 'accent.hover' } },
		{ name: 'button-text', value: { from: 'accent.foreground' } },
	],
} satisfies ThemeDefinition;

describe('baseTheme', () => {
	test('is the default theme', () => {
		const result = objectTheme('#ff6600');
		expect(Object.keys(result.light)).toHaveLength(31);
		expect(Object.keys(result.dark)).toHaveLength(31);
		expect(objectTheme('#ff6600', baseTheme)).toEqual(result);
	});
});

describe('ThemeDefinition', () => {
	test('role keys set output names and surface foregrounds', () => {
		const { light } = objectTheme('#ff6600', {
			roles: {
				background: { generate: 'surface' },
				brand: { generate: 'accent' },
				danger: { generate: 'negative' },
			},
		});
		expect(Object.keys(light).sort()).toEqual(
			[
				...['', '-strong', '-weak', '-foreground', '-foreground-weak'].flatMap(
					(s) => [`background${s}`, `brand${s}`, `danger${s}`],
				),
				'background-foreground-brand',
				'background-foreground-danger',
			].sort(),
		);
	});

	test('a theme built from scratch only has its declared roles', () => {
		const { light } = objectTheme('#ff6600', {
			roles: { accent: { generate: 'accent' } },
		});
		expect(Object.keys(light).sort()).toEqual(
			[
				'accent',
				'accent-strong',
				'accent-weak',
				'accent-foreground',
				'accent-foreground-weak',
			].sort(),
		);
	});

	test('custom theme applies style, variants, roles, and tokens', () => {
		const { light } = objectTheme('#ff6600', customTheme);
		expect(light).toHaveProperty('accent-hover');
		expect(light).toHaveProperty('surface-foreground-danger');
		expect(light).toHaveProperty('success-foreground');
		expect(light).toHaveProperty('cta-hover');
		expect(light).toHaveProperty('surface-foreground-cta');
		expect(light['button-hover']).toBe(light['accent-hover']);
		expect(light['brand-exact']).toBe('#ff6600');
		expect(light).not.toHaveProperty('positive');
	});

	test('the runtime accent ignores defaultAccent', () => {
		expect(
			objectTheme('#ff6600', { ...baseTheme, defaultAccent: '#000' }),
		).toEqual(objectTheme('#ff6600'));
	});

	test('survives a JSON round trip', () => {
		const copy = JSON.parse(JSON.stringify(customTheme)) as ThemeDefinition;
		expect(objectTheme('#6366f1', copy)).toEqual(
			objectTheme('#6366f1', customTheme),
		);
	});

	test('one definition regenerates for any accent', () => {
		const a = objectTheme('#ff6600', customTheme);
		const b = objectTheme('#0000ff', customTheme);
		expect(Object.keys(a.light)).toEqual(Object.keys(b.light));
		expect(a.light.accent).not.toBe(b.light.accent);
		expect(hextimate('#ff6600', customTheme).fork('#0000ff').format()).toEqual(
			hextimate('#0000ff', customTheme).format(),
		);
	});

	test('repeated non-surface generators produce separate roles', () => {
		const { light } = objectTheme('#ff6600', {
			roles: {
				surface: { generate: 'surface' },
				brand: { generate: 'accent' },
				link: { generate: 'accent' },
			},
		});
		expect(light.link).toBe(light.brand);
		expect(light['surface-foreground-link']).toBe(
			light['surface-foreground-brand'],
		);
	});

	test('two surface roles throw', () => {
		expect(() =>
			hextimate('#ff6600', {
				roles: {
					a: { generate: 'surface' },
					b: { generate: 'surface' },
				},
			}),
		).toThrow('only one surface role');
	});

	test('variantNames and format set output defaults', () => {
		const result = hextimate('#ff6600', {
			...baseTheme,
			variantNames: { DEFAULT: 'main', foreground: 'contrastText' },
			format: { as: 'object', colors: 'oklch' },
		}).format() as Tokens;
		expect(result.light['accent-main']).toMatch(/^oklch\(/);
		expect(result.light).toHaveProperty('accent-contrastText');
	});

	test('derived roles get colored text on the surface', () => {
		const { light } = objectTheme('#ff6600', {
			roles: {
				surface: { generate: 'surface' },
				accent: { generate: 'accent' },
				link: { from: 'accent', hue: 180 },
			},
		});
		expect(light).toHaveProperty('surface-foreground-link');
		expect(light).not.toHaveProperty('surface-foreground-surface');
	});

	test('a styled preset restyles the whole theme and keeps earlier steps', () => {
		const muted = {
			style: { surfaceMaxChroma: 0, light: { maxChroma: 0.05 } },
		};
		const late = hextimate('#ff6600', customTheme)
			.addRole('banner', '#00aa88')
			.preset(muted)
			.format({ as: 'object' }) as Tokens;
		const early = hextimate('#ff6600', {
			...customTheme,
			style: { ...customTheme.style, ...muted.style },
		})
			.addRole('banner', '#00aa88')
			.format({ as: 'object' }) as Tokens;
		expect(late).toEqual(early);
		expect(late.light).toHaveProperty('cta-hover');
	});

	test('builder chains still apply on top of a theme', () => {
		const { light } = hextimate('#ff6600', customTheme)
			.addRole('banner', '#00aa88')
			.format({ as: 'object' }) as Tokens;
		expect(light).toHaveProperty('banner');
		expect(light).toHaveProperty('success');
	});
});
