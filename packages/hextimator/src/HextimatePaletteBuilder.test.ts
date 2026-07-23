import { describe, expect, it } from 'bun:test';
import { calculateContrast } from './generate/utils';
import { convertColor, hextimate, parseColor } from './index';
import type { HextimatePreset } from './presets/types';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function lightKeys(result: ReturnType<typeof formatObject>) {
	return Object.keys(result.light);
}

function formatObject(builder: ReturnType<typeof hextimate>) {
	return builder.format({ as: 'object', colors: 'hex' }) as {
		light: Record<string, string>;
		dark: Record<string, string>;
	};
}

// ──────────────────────────────────────────────
// 1. Construction & default output
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: construction', () => {
	it('returns a builder with chainable methods', () => {
		const builder = hextimate('#ff6600');
		expect(builder.addRole).toBeFunction();
		expect(builder.addVariant).toBeFunction();
		expect(builder.addToken).toBeFunction();
		expect(builder.format).toBeFunction();
		expect(builder.fork).toBeFunction();
		expect(builder.simulate).toBeFunction();
		expect(builder.adaptFor).toBeFunction();
		expect(builder.preset).toBeFunction();
	});

	it('produces light and dark themes by default', () => {
		const result = hextimate('#ff6600').format();
		expect(result).toHaveProperty('light');
		expect(result).toHaveProperty('dark');
	});

	it('default palette has surface, accent, positive, negative, caution roles', () => {
		const result = formatObject(hextimate('#ff6600'));
		const keys = lightKeys(result);
		for (const role of [
			'surface',
			'accent',
			'positive',
			'negative',
			'caution',
		]) {
			expect(keys).toContain(role);
			expect(keys).toContain(`${role}-strong`);
			expect(keys).toContain(`${role}-weak`);
			expect(keys).toContain(`${role}-foreground`);
		}
	});

	it('all methods return this for chaining', () => {
		const builder = hextimate('#ff6600');
		expect(builder.addRole('cta', '#ee2244')).toBe(builder);
		expect(builder.addVariant('hover', { from: 'strong' })).toBe(builder);
		expect(builder.addToken('brand', '#000')).toBe(builder);
		expect(builder.simulate('deuteranopia')).toBe(builder);
		expect(builder.adaptFor('protanopia')).toBe(builder);
	});
});

// ──────────────────────────────────────────────
// 2. format() output formats
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: format()', () => {
	it('css format returns a ready-to-paste stylesheet string', () => {
		const result = hextimate('#ff6600').format({ as: 'css' });
		expect(typeof result).toBe('string');
		expect(result).toContain(':root {');
		expect(result).toContain('--surface:');
		expect(result).toContain('@media (prefers-color-scheme: dark)');
	});

	it('css format respects darkMode and selector options', () => {
		const result = hextimate('#ff6600').format({
			as: 'css',
			darkMode: 'class',
			selector: '[data-root]',
		});
		expect(result).toContain('[data-root] {');
		expect(result).toContain('.dark {');
		expect(result).not.toContain('@media');
	});

	it('scss format prefixes keys with $', () => {
		const result = hextimate('#ff6600').format({ as: 'scss' });
		const keys = Object.keys(result.light);
		expect(keys.every((k) => k.startsWith('$'))).toBe(true);
	});

	it('tailwind format produces nested structure', () => {
		const result = hextimate('#ff6600').format({ as: 'tailwind' });
		const light = result.light as Record<string, Record<string, string>>;
		expect(light.accent).toBeDefined();
		expect(light.accent.DEFAULT).toBeDefined();
		expect(light.accent.strong).toBeDefined();
	});

	it('json format returns a string', () => {
		const result = hextimate('#ff6600').format({ as: 'json' });
		expect(typeof result.light).toBe('string');
		expect(typeof result.dark).toBe('string');
		expect(() => JSON.parse(result.light as string)).not.toThrow();
	});

	it('tailwind-css format returns a single combined stylesheet string', () => {
		const result = hextimate('#ff6600').format({ as: 'tailwind-css' });
		expect(typeof result).toBe('string');
		expect(result).toContain('@theme {');
		expect(result).toContain('--color-surface:');
		expect(result.match(/@theme/g) ?? []).toHaveLength(1);
	});

	it('hex color format outputs hex values', () => {
		const result = formatObject(hextimate('#ff6600'));
		expect(result.light.accent).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('oklch color format outputs oklch values', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			colors: 'oklch',
		});
		const light = result.light as Record<string, string>;
		expect(light.accent).toMatch(/^oklch\(/);
	});

	it('rgb color format outputs rgb values', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			colors: 'rgb',
		});
		const light = result.light as Record<string, string>;
		expect(light.accent).toMatch(/^rgb\(/);
	});

	it('hsl color format outputs hsl values', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			colors: 'hsl',
		});
		const light = result.light as Record<string, string>;
		expect(light.accent).toMatch(/^hsl\(/);
	});

	it('custom separator changes key delimiter', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			separator: '/',
		});
		const keys = Object.keys(result.light);
		expect(keys).toContain('accent/strong');
		expect(keys).not.toContain('accent-strong');
	});

	it('roleNames renames roles in output', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			roleNames: { accent: 'primary' },
		});
		const keys = Object.keys(result.light);
		expect(keys).toContain('primary');
		expect(keys).toContain('primary-strong');
		expect(keys).not.toContain('accent');
	});

	it('variantNames renames variants in output', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			variantNames: { strong: 'bold', weak: 'subtle' },
		});
		const keys = Object.keys(result.light);
		expect(keys).toContain('accent-bold');
		expect(keys).toContain('accent-subtle');
		expect(keys).not.toContain('accent-strong');
		expect(keys).not.toContain('accent-weak');
	});
});

// ──────────────────────────────────────────────
// 3. addRole
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: addRole()', () => {
	it('adds a new role with full scale', () => {
		const result = formatObject(hextimate('#ff6600').addRole('cta', '#ee2244'));
		const keys = lightKeys(result);
		expect(keys).toContain('cta');
		expect(keys).toContain('cta-strong');
		expect(keys).toContain('cta-weak');
		expect(keys).toContain('cta-foreground');
	});

	it('new role appears in both themes', () => {
		const result = formatObject(hextimate('#ff6600').addRole('cta', '#ee2244'));
		expect(result.light.cta).toBeDefined();
		expect(result.dark.cta).toBeDefined();
	});

	it('multiple roles can be added', () => {
		const result = formatObject(
			hextimate('#ff6600').addRole('cta', '#ee2244').addRole('info', '#3366cc'),
		);
		const keys = lightKeys(result);
		expect(keys).toContain('cta');
		expect(keys).toContain('info');
	});

	it('derived role from existing role produces full scale', () => {
		const result = formatObject(
			hextimate('#ff6600').addRole('cta', { from: 'accent', hue: 180 }),
		);
		const keys = lightKeys(result);
		expect(keys).toContain('cta');
		expect(keys).toContain('cta-strong');
		expect(keys).toContain('cta-weak');
		expect(keys).toContain('cta-foreground');
	});

	it('derived role hue is shifted from source', () => {
		const result = hextimate('#ff6600')
			.addRole('complement', { from: 'accent', hue: 180 })
			.format({ as: 'object', colors: 'oklch' });
		const light = result.light as Record<string, string>;

		const parseH = (s: string) => {
			const parts = s.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
			return parts ? Number.parseFloat(parts[3]) : 0;
		};

		const accentH = parseH(light.accent);
		const complementH = parseH(light.complement);
		// Hue should be ~180° apart (allow some tolerance for gamut mapping)
		const rawDiff = (complementH - accentH + 360) % 360;
		const diff = Math.abs(rawDiff - 180);
		expect(diff).toBeLessThan(5);
	});

	it('derived role with chroma offset', () => {
		const result = formatObject(
			hextimate('#ff6600').addRole('muted', {
				from: 'accent',
				chroma: -0.05,
			}),
		);
		expect(result.light.muted).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.dark.muted).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('derived role appears in both themes', () => {
		const result = formatObject(
			hextimate('#ff6600').addRole('cta', { from: 'accent', hue: 90 }),
		);
		expect(result.light.cta).toBeDefined();
		expect(result.dark.cta).toBeDefined();
	});

	it('derived role is preserved through fork', () => {
		const builder = hextimate('#ff6600').addRole('cta', {
			from: 'accent',
			hue: 180,
		});
		const forked = builder.fork('#0000ff');
		expect(lightKeys(formatObject(forked))).toContain('cta');
	});
});

// ──────────────────────────────────────────────
// 4. addVariant
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: addVariant()', () => {
	it('from-variant appears on all roles', () => {
		const result = formatObject(
			hextimate('#ff6600').addVariant('hover', { from: 'strong' }),
		);
		const keys = lightKeys(result);
		for (const role of [
			'accent',
			'surface',
			'positive',
			'negative',
			'caution',
		]) {
			expect(keys).toContain(`${role}-hover`);
		}
	});

	it('between variant appears on all roles', () => {
		const result = formatObject(
			hextimate('#ff6600').addVariant('mid', {
				between: ['DEFAULT', 'strong'],
			}),
		);
		const keys = lightKeys(result);
		for (const role of ['accent', 'surface']) {
			expect(keys).toContain(`${role}-mid`);
		}
	});

	it('between variant lightness is between its references', () => {
		const result = hextimate('#6366f1')
			.addVariant('mid', { between: ['DEFAULT', 'strong'] })
			.format({ as: 'object', colors: 'oklch' });
		const light = result.light as Record<string, string>;

		const parseL = (s: string) => {
			const m = s.match(/oklch\(\s*([\d.]+)/);
			return m ? Number.parseFloat(m[1]) : 0;
		};

		const defaultL = parseL(light.accent);
		const strongL = parseL(light['accent-strong']);
		const midL = parseL(light['accent-mid']);

		const minL = Math.min(defaultL, strongL);
		const maxL = Math.max(defaultL, strongL);
		expect(midL).toBeGreaterThanOrEqual(minL - 0.01);
		expect(midL).toBeLessThanOrEqual(maxL + 0.01);
	});

	it('variant also appears on custom roles added before it', () => {
		const result = formatObject(
			hextimate('#ff6600')
				.addRole('cta', '#ee2244')
				.addVariant('hover', { from: 'strong' }),
		);
		expect(lightKeys(result)).toContain('cta-hover');
	});
});

// ──────────────────────────────────────────────
// 4b. addVariant from "foreground"
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: addVariant() from foreground', () => {
	const parseL = (s: string) => {
		const m = s.match(/oklch\(\s*([\d.]+)/);
		return m ? Number.parseFloat(m[1]) : 0;
	};

	it('from "foreground" still satisfies the contrast ratio against DEFAULT', () => {
		const result = hextimate('#6366f1')
			.addVariant('foreground-weak', { from: 'foreground' })
			.format({ as: 'object', colors: 'hex' });
		const light = result.light as Record<string, string>;
		const dark = result.dark as Record<string, string>;

		for (const theme of [light, dark]) {
			const contrast = calculateContrast(
				parseColor(theme['surface-foreground-weak']),
				parseColor(theme.surface),
			);
			expect(contrast).toBeGreaterThanOrEqual(6.9);
		}
	});

	it('from "foreground" is softer than foreground itself', () => {
		const result = hextimate('#6366f1')
			.addVariant('foreground-weak', { from: 'foreground' })
			.format({ as: 'object', colors: 'hex' });
		const light = result.light as Record<string, string>;

		const surface = parseColor(light.surface);
		const fgContrast = calculateContrast(
			parseColor(light['surface-foreground']),
			surface,
		);
		const weakContrast = calculateContrast(
			parseColor(light['surface-foreground-weak']),
			surface,
		);
		expect(weakContrast).toBeLessThan(fgContrast);
	});

	it('emphasis anchors explicitly to foreground (lighter in light, darker in dark)', () => {
		const result = hextimate('#6366f1')
			.addVariant('foreground-soft', { from: 'foreground', emphasis: -0.1 })
			.format({ as: 'object', colors: 'oklch' });
		const light = result.light as Record<string, string>;
		const dark = result.dark as Record<string, string>;

		expect(parseL(light['surface-foreground-soft'])).toBeGreaterThan(
			parseL(light['surface-foreground']),
		);
		expect(parseL(dark['surface-foreground-soft'])).toBeLessThan(
			parseL(dark['surface-foreground']),
		);
	});

	it('emphasis on a side variant places explicitly without redistributing siblings', () => {
		const base = hextimate('#6366f1').format({
			as: 'object',
			colors: 'oklch',
		});
		const withVariant = hextimate('#6366f1')
			.addVariant('hover', { from: 'strong', emphasis: 0.05 })
			.format({ as: 'object', colors: 'oklch' });
		const baseLight = base.light as Record<string, string>;
		const variantLight = withVariant.light as Record<string, string>;

		expect(variantLight['accent-strong']).toBe(baseLight['accent-strong']);
		expect(variantLight['accent-hover']).toBeDefined();
	});

	it('chaining from a foreground-anchored variant without emphasis duplicates the anchor', () => {
		const result = hextimate('#6366f1')
			.addVariant('foreground-muted', { from: 'foreground' })
			.addVariant('foreground-very-muted', { from: 'foreground-muted' })
			.format({ as: 'object', colors: 'oklch' });
		const light = result.light as Record<string, string>;
		const dark = result.dark as Record<string, string>;

		expect(light['accent-foreground-very-muted']).toBe(
			light['accent-foreground-muted'],
		);
		expect(dark['accent-foreground-very-muted']).toBe(
			dark['accent-foreground-muted'],
		);
	});

	it('chaining from a foreground-anchored variant does not shift the strong side', () => {
		const baseStrong = hextimate('#6366f1').format({
			as: 'object',
			colors: 'oklch',
		}).light as Record<string, string>;
		const chained = hextimate('#6366f1')
			.addVariant('foreground-muted', { from: 'foreground' })
			.addVariant('foreground-very-muted', { from: 'foreground-muted' })
			.format({ as: 'object', colors: 'oklch' });
		const chainedLight = chained.light as Record<string, string>;

		expect(chainedLight['accent-strong']).toBe(baseStrong['accent-strong']);
	});

	it('emphasis on a foreground-anchored chain shifts relative to the anchor', () => {
		const result = hextimate('#6366f1')
			.addVariant('foreground-muted', { from: 'foreground' })
			.addVariant('foreground-very-muted', {
				from: 'foreground-muted',
				emphasis: -0.05,
			})
			.format({ as: 'object', colors: 'oklch' });
		const light = result.light as Record<string, string>;
		const dark = result.dark as Record<string, string>;

		expect(parseL(light['surface-foreground-very-muted'])).toBeGreaterThan(
			parseL(light['surface-foreground-muted']),
		);
		expect(parseL(dark['surface-foreground-very-muted'])).toBeLessThan(
			parseL(dark['surface-foreground-muted']),
		);
	});
});

// ──────────────────────────────────────────────
// 5. addToken
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: addToken()', () => {
	it('adds a standalone color token', () => {
		const result = formatObject(
			hextimate('#ff6600').addToken('brand', '#3a86ff'),
		);
		expect(result.light.brand).toBeDefined();
		expect(result.dark.brand).toBeDefined();
	});

	it('derived token resolves from existing role', () => {
		const result = formatObject(
			hextimate('#ff6600').addToken('accentBright', {
				from: 'accent',
				lightness: 0.05,
			}),
		);
		expect(result.light.accentBright).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('derived token with role.variant syntax', () => {
		const result = formatObject(
			hextimate('#ff6600').addToken('strongRef', {
				from: 'accent.strong',
				lightness: -0.02,
			}),
		);
		expect(result.light.strongRef).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('per-theme token uses different values for light and dark', () => {
		const result = formatObject(
			hextimate('#ff6600').addToken('panel', {
				light: { from: 'surface.weak', lightness: 0.05 },
				dark: { from: 'surface.weak', lightness: -0.05 },
			}),
		);
		expect(result.light.panel).not.toBe(result.dark.panel);
	});

	it('per-theme token with raw colors', () => {
		const result = formatObject(
			hextimate('#ff6600').addToken('overlay', {
				light: '#ffffff',
				dark: '#000000',
			}),
		);
		expect(result.light.overlay).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.dark.overlay).toMatch(/^#[0-9a-f]{6}$/);
		// White and black should be very different
		expect(result.light.overlay).not.toBe(result.dark.overlay);
	});

	it('emphasis produces same result as manual light/dark split', () => {
		const manual = formatObject(
			hextimate('#ff6600').addToken('divider', {
				light: { from: 'surface', lightness: -0.12 },
				dark: { from: 'surface', lightness: +0.12 },
			}),
		);
		const withEmphasis = formatObject(
			hextimate('#ff6600').addToken('divider', {
				from: 'surface',
				emphasis: 0.12,
			}),
		);
		expect(withEmphasis.light.divider).toBe(manual.light.divider);
		expect(withEmphasis.dark.divider).toBe(manual.dark.divider);
	});

	it('negative emphasis softens toward background', () => {
		const manual = formatObject(
			hextimate('#ff6600').addToken('text-secondary', {
				light: { from: 'surface.foreground', lightness: +0.2 },
				dark: { from: 'surface.foreground', lightness: -0.2 },
			}),
		);
		const withEmphasis = formatObject(
			hextimate('#ff6600').addToken('text-secondary', {
				from: 'surface.foreground',
				emphasis: -0.2,
			}),
		);
		expect(withEmphasis.light['text-secondary']).toBe(
			manual.light['text-secondary'],
		);
		expect(withEmphasis.dark['text-secondary']).toBe(
			manual.dark['text-secondary'],
		);
	});

	it('emphasis combined with lightness and chroma', () => {
		const result = formatObject(
			hextimate('#ff6600').addToken('custom', {
				from: 'accent',
				emphasis: 0.1,
				lightness: 0.02,
				chroma: -0.03,
			}),
		);
		expect(result.light.custom).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.dark.custom).toMatch(/^#[0-9a-f]{6}$/);
		// Light and dark should differ since emphasis flips direction
		expect(result.light.custom).not.toBe(result.dark.custom);
	});
});

// ──────────────────────────────────────────────
// 5b. addToken: palette pins vs label collisions
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: addToken palette addressing', () => {
	it('palette pin cascades to from: derived tokens', () => {
		const pin = '#123456';
		const withPin = formatObject(
			hextimate('#ff6600')
				.addToken('surface.weak', pin)
				.addToken('border', { from: 'surface.weak', lightness: -0.05 }),
		);
		const withoutPin = formatObject(
			hextimate('#ff6600').addToken('border', {
				from: 'surface.weak',
				lightness: -0.05,
			}),
		);

		expect(withPin.light['surface-weak']).toBe(pin);
		expect(withPin.light.border).not.toBe(withoutPin.light.border);
		expect(withPin.light.border).not.toBe(pin);

		const borderL = convertColor(parseColor(withPin.light.border), 'oklch').l;
		const pinL = convertColor(parseColor(pin), 'oklch').l;
		expect(borderL).toBeCloseTo(pinL - 0.05, 2);
	});

	it('kebab label that collides with a generated token throws', () => {
		expect(() =>
			hextimate('#ff6600').addToken('surface-weak', '#123456').format(),
		).toThrow('collides with a generated token');
		expect(() =>
			hextimate('#ff6600').addToken('surface-weak', '#123456').format(),
		).toThrow('addToken("surface.weak")');
	});

	it('DEFAULT label collision suggests role.DEFAULT', () => {
		expect(() =>
			hextimate('#ff6600').addToken('surface', '#123456').format(),
		).toThrow('addToken("surface.DEFAULT")');
	});

	it('custom role and variant labels collide', () => {
		expect(() =>
			hextimate('#ff6600')
				.addRole('cta', '#ee2244')
				.addVariant('hover', { from: 'strong' })
				.addToken('cta-hover', '#000000')
				.format(),
		).toThrow('addToken("cta.hover")');
	});

	it('collision respects roleNames and variantNames', () => {
		expect(() =>
			hextimate('#ff6600')
				.addToken('bg-soft', '#123456')
				.format({
					roleNames: { surface: 'bg' },
					variantNames: { weak: 'soft' },
				}),
		).toThrow('addToken("surface.weak")');

		const result = hextimate('#ff6600')
			.addToken('surface-weak', '#abcdef')
			.format({
				as: 'object',
				colors: 'hex',
				roleNames: { surface: 'bg' },
			}) as { light: Record<string, string> };
		expect(result.light['surface-weak']).toBe('#abcdef');
		expect(result.light['bg-weak']).toBeDefined();
		expect(result.light['bg-weak']).not.toBe('#abcdef');
	});

	it('collision respects separator', () => {
		expect(() =>
			hextimate('#ff6600')
				.addToken('surface_weak', '#123456')
				.format({ separator: '_' }),
		).toThrow('collides with a generated token');

		const result = hextimate('#ff6600')
			.addToken('surface-weak', '#abcdef')
			.format({
				as: 'object',
				colors: 'hex',
				separator: '_',
			}) as { light: Record<string, string> };
		expect(result.light['surface-weak']).toBe('#abcdef');
		expect(result.light.surface_weak).toBeDefined();
		expect(result.light.surface_weak).not.toBe('#abcdef');
	});

	it('non-colliding standalone tokens behave as before', () => {
		const result = formatObject(
			hextimate('#ff6600').addToken('border', {
				from: 'surface.weak',
				lightness: -0.05,
			}),
		);
		expect(result.light.border).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.light['surface-weak']).toBeDefined();
		expect(result.light.border).not.toBe(result.light['surface-weak']);
	});

	it('brand-exact remains overwritable as a standalone', () => {
		const result = formatObject(
			hextimate('#ff6600').addToken('brand-exact', '#00ff00'),
		);
		expect(result.light['brand-exact']).toBe('#00ff00');
	});

	it('palette pin of DEFAULT works via dotted form', () => {
		const pin = '#112233';
		const result = formatObject(
			hextimate('#ff6600').addToken('surface.DEFAULT', pin),
		);
		expect(result.light.surface).toBe(pin);
	});

	it('fork replays palette pins', () => {
		const pin = '#123456';
		const builder = hextimate('#ff6600').addToken('surface.weak', pin);
		const forked = builder.fork('#0000ff');
		expect(formatObject(forked).light['surface-weak']).toBe(pin);
	});
});

// ──────────────────────────────────────────────
// 6. light / dark theme adjustments (via options)
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: light / dark options', () => {
	it('light adjustments change light theme output', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600').style({ light: { baseLightness: 0.8 } }),
		);
		expect(adjusted.light.accent).not.toBe(normal.light.accent);
	});

	it('per-theme baseLightness wins over exact input chip accent anchor', () => {
		const hex = '#3b82f6';
		const inputL = convertColor(parseColor(hex), 'oklch').l;
		const target = 0.85;
		const adjusted = formatObject(
			hextimate(hex).style({ light: { baseLightness: target } }),
		);
		const outL = convertColor(parseColor(adjusted.light.accent), 'oklch').l;
		expect(Math.abs(outL - inputL)).toBeGreaterThan(0.05);
		expect(outL).toBeCloseTo(target, 1);
	});

	it('top-level baseLightness wins over exact input chip accent anchor', () => {
		const hex = '#3b82f6';
		const inputL = convertColor(parseColor(hex), 'oklch').l;
		const target = 0.85;
		const adjusted = formatObject(
			hextimate(hex).style({ baseLightness: target }),
		);
		const lightL = convertColor(parseColor(adjusted.light.accent), 'oklch').l;
		const darkL = convertColor(parseColor(adjusted.dark.accent), 'oklch').l;
		expect(Math.abs(lightL - inputL)).toBeGreaterThan(0.05);
		expect(lightL).toBeCloseTo(target, 1);
		expect(Math.abs(darkL - inputL)).toBeGreaterThan(0.03);
	});

	it('light adjustments do not change dark theme', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600').style({ light: { baseLightness: 0.8 } }),
		);
		expect(adjusted.dark.accent).toBe(normal.dark.accent);
	});

	it('dark adjustments change dark theme output', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600').style({ dark: { baseLightness: 0.5 } }),
		);
		expect(adjusted.dark.accent).not.toBe(normal.dark.accent);
	});

	it('dark adjustments do not change light theme', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600').style({ dark: { baseLightness: 0.5 } }),
		);
		expect(adjusted.light.accent).toBe(normal.light.accent);
	});

	it('maxChroma adjustment affects output', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600').style({ light: { maxChroma: 0.05 } }),
		);
		// With heavily clamped chroma, the color should be different
		expect(adjusted.light.accent).not.toBe(normal.light.accent);
	});

	it('adjustments work alongside addRole', () => {
		const result = formatObject(
			hextimate('#ff6600')
				.style({ light: { baseLightness: 0.8 } })
				.addRole('cta', '#ee2244'),
		);
		expect(result.light.cta).toBeDefined();
	});

	it('per-theme minContrastRatio override affects only that theme', () => {
		const global = formatObject(
			hextimate('#ff6600').style({ minContrastRatio: 'AAA' }),
		);
		const overridden = formatObject(
			hextimate('#ff6600').style({
				minContrastRatio: 'AAA',
				light: { minContrastRatio: 'AA' },
			}),
		);
		// Light theme should differ (relaxed contrast)
		expect(overridden.light.accent).not.toBe(global.light.accent);
		// Dark theme unchanged (still AAA)
		expect(overridden.dark.accent).toBe(global.dark.accent);
	});

	it('deprecated `lightness` alias still maps to baseLightness', () => {
		const warn = console.warn;
		console.warn = () => {};
		try {
			const viaNew = formatObject(
				hextimate('#ff6600').style({ light: { baseLightness: 0.8 } }),
			);
			const viaOld = formatObject(
				hextimate('#ff6600').style({ light: { lightness: 0.8 } }),
			);
			expect(viaOld.light.accent).toBe(viaNew.light.accent);
		} finally {
			console.warn = warn;
		}
	});

	it('baseLightness wins when both are set', () => {
		const warn = console.warn;
		console.warn = () => {};
		try {
			const viaNew = formatObject(
				hextimate('#ff6600').style({ light: { baseLightness: 0.8 } }),
			);
			const viaBoth = formatObject(
				hextimate('#ff6600').style({
					light: { baseLightness: 0.8, lightness: 0.4 },
				}),
			);
			expect(viaBoth.light.accent).toBe(viaNew.light.accent);
		} finally {
			console.warn = warn;
		}
	});

	it('per-theme surfaceMaxChroma override affects only that theme', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600').style({
				dark: { surfaceMaxChroma: 0.06 },
			}),
		);
		// Dark surface colors should be more chromatic
		expect(adjusted.dark.surface).not.toBe(normal.dark.surface);
		// Light surface colors unchanged
		expect(adjusted.light.surface).toBe(normal.light.surface);
	});

	it('per-theme foregroundMaxChroma override affects only that theme', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600').style({
				light: { foregroundMaxChroma: 0.08 },
			}),
		);
		expect(adjusted.light['accent-foreground']).not.toBe(
			normal.light['accent-foreground'],
		);
		expect(adjusted.dark['accent-foreground']).toBe(
			normal.dark['accent-foreground'],
		);
	});

	it('per-theme override takes precedence over global value', () => {
		const globalOnly = formatObject(
			hextimate('#ff6600').style({ surfaceMaxChroma: 0.06 }),
		);
		const withOverride = formatObject(
			hextimate('#ff6600').style({
				surfaceMaxChroma: 0.06,
				light: { surfaceMaxChroma: 0.01 },
			}),
		);
		// Light uses override (0.01), so differs from global-only (0.06)
		expect(withOverride.light.surface).not.toBe(globalOnly.light.surface);
		// Dark uses global (0.06), so matches
		expect(withOverride.dark.surface).toBe(globalOnly.dark.surface);
	});
});

// ──────────────────────────────────────────────
// 7. fork()
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: fork()', () => {
	it('fork with no args produces identical output', () => {
		const builder = hextimate('#ff6600').addRole('cta', '#ee2244');
		const forked = builder.fork();
		expect(formatObject(forked)).toEqual(formatObject(builder));
	});

	it('fork with new color changes output', () => {
		const builder = hextimate('#ff6600');
		const forked = builder.fork('#0000ff');
		expect(formatObject(forked).light.accent).not.toBe(
			formatObject(builder).light.accent,
		);
	});

	it('fork preserves addRole operations', () => {
		const builder = hextimate('#ff6600').addRole('cta', '#ee2244');
		const forked = builder.fork('#0000ff');
		expect(lightKeys(formatObject(forked))).toContain('cta');
	});

	it('fork preserves addVariant operations', () => {
		const builder = hextimate('#ff6600').addVariant('hover', {
			from: 'strong',
		});
		const forked = builder.fork('#0000ff');
		expect(lightKeys(formatObject(forked))).toContain('accent-hover');
	});

	it('fork preserves addToken operations', () => {
		const builder = hextimate('#ff6600').addToken('brand', '#000');
		const forked = builder.fork('#0000ff');
		expect(formatObject(forked).light.brand).toBeDefined();
	});

	it('fork preserves theme adjustments from options', () => {
		const builder = hextimate('#ff6600').style({
			light: { baseLightness: 0.8 },
		});
		const normal = formatObject(hextimate('#ff6600'));
		const forked = formatObject(builder.fork());
		// Forked should have light adjustments, different from unadjusted
		expect(forked.light.accent).not.toBe(normal.light.accent);
	});

	it('fork is independent — mutations do not affect parent', () => {
		const builder = hextimate('#ff6600');
		const parentResult = formatObject(builder);
		const forked = builder.fork();
		forked.addRole('extra', '#00ff00');
		// Parent should not have the extra role
		const parentAfter = formatObject(builder);
		expect(lightKeys(parentAfter)).not.toContain('extra');
		expect(parentAfter).toEqual(parentResult);
	});

	it('fork().style() overrides style options', () => {
		const builder = hextimate('#ff6600');
		const forked = builder.fork().style({ light: { baseLightness: 0.85 } });
		const normal = formatObject(builder);
		const forkedResult = formatObject(forked);
		expect(forkedResult.light.accent).not.toBe(normal.light.accent);
	});

	it('fork(color).style() applies color and style', () => {
		const builder = hextimate('#ff6600');
		const forked = builder
			.fork('#0000ff')
			.style({ light: { baseLightness: 0.85 } });
		const result = formatObject(forked);
		expect(result.light.accent).toBeDefined();
		// Should differ from both the original color and default base lightness
		expect(result.light.accent).not.toBe(formatObject(builder).light.accent);
	});
});

// ──────────────────────────────────────────────
// 8. simulate() / adaptFor()
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: simulate() / adaptFor()', () => {
	it('simulate changes palette colors', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const simulated = formatObject(
			hextimate('#ff6600').simulate('deuteranopia'),
		);
		// At least one color should differ
		expect(simulated.light.accent).not.toBe(normal.light.accent);
	});

	it('simulate with severity 0 produces same output', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const simulated = formatObject(
			hextimate('#ff6600').simulate('deuteranopia', 0),
		);
		expect(simulated.light.accent).toBe(normal.light.accent);
	});

	it('adaptFor changes palette colors', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adapted = formatObject(hextimate('#ff6600').adaptFor('deuteranopia'));
		expect(adapted.light.accent).not.toBe(normal.light.accent);
	});

	it('adaptFor with severity 0 produces same output', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adapted = formatObject(
			hextimate('#ff6600').adaptFor('deuteranopia', 0),
		);
		expect(adapted.light.accent).toBe(normal.light.accent);
	});

	it('simulate is preserved through fork', () => {
		const builder = hextimate('#ff6600').simulate('protanopia');
		const forked = builder.fork('#0000ff');
		const normalBlue = formatObject(hextimate('#0000ff'));
		const forkedResult = formatObject(forked);
		expect(forkedResult.light.accent).not.toBe(normalBlue.light.accent);
	});

	it('adaptFor is preserved through fork', () => {
		const builder = hextimate('#ff6600').adaptFor('tritanopia');
		const forked = builder.fork('#0000ff');
		const normalBlue = formatObject(hextimate('#0000ff'));
		const forkedResult = formatObject(forked);
		expect(forkedResult.light.accent).not.toBe(normalBlue.light.accent);
	});
});

// ──────────────────────────────────────────────
// 9. preset()
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: preset()', () => {
	const customPreset: HextimatePreset = {
		roles: [{ name: 'info', color: '#3366cc' }],
		variants: [{ name: 'hover', placement: { from: 'strong' } }],
		tokens: [{ name: 'ring', value: { from: 'accent', lightness: 0.1 } }],
		format: {
			as: 'css',
			colors: 'oklch',
			roleNames: { accent: 'primary' },
		},
	};

	it('applies roles from preset', () => {
		const result = hextimate('#6366f1').preset(customPreset).format({
			as: 'object',
		});
		expect(Object.keys(result.light)).toContain('info');
	});

	it('applies variants from preset', () => {
		const result = hextimate('#6366f1').preset(customPreset).format({
			as: 'object',
		});
		const keys = Object.keys(result.light);
		// Preset renames accent → primary, so the variant key uses the renamed role
		expect(keys).toContain('primary-hover');
	});

	it('applies tokens from preset', () => {
		const result = hextimate('#6366f1').preset(customPreset).format({
			as: 'object',
		});
		expect(Object.keys(result.light)).toContain('ring');
	});

	it('preset format defaults are used when no format options given', () => {
		const result = hextimate('#6366f1').preset(customPreset).format();
		// Preset sets as: 'css' → full stylesheet string with `:root` wrapper
		expect(typeof result).toBe('string');
		expect(result).toContain(':root {');
		// Preset renames accent → primary; declarations use `--primary`
		expect(result).toContain('--primary:');
	});

	it('format options override preset defaults', () => {
		const result = hextimate('#6366f1')
			.preset(customPreset)
			.format({ as: 'object', colors: 'hex' });
		const light = result.light as Record<string, string>;
		// as: 'object' overrides as: 'css'
		expect(Object.keys(light).some((k) => k.startsWith('--'))).toBe(false);
		// colors: 'hex' overrides colors: 'oklch'
		expect(light.surface).toMatch(/^#/);
	});

	it('multiple presets can be applied sequentially', () => {
		const preset1: HextimatePreset = {
			roles: [{ name: 'info', color: '#3366cc' }],
		};
		const preset2: HextimatePreset = {
			tokens: [{ name: 'surface.DEFAULT', value: '#fafafa' }],
		};
		const result = formatObject(
			hextimate('#6366f1').preset(preset1).preset(preset2),
		);
		expect(lightKeys(result)).toContain('info');
		expect(result.light.surface).toBe('#fafafa');
	});
});

// ──────────────────────────────────────────────
// 10. Complex chaining scenarios
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: complex chaining', () => {
	it('addRole → addVariant → addToken → format', () => {
		const result = formatObject(
			hextimate('#ff6600')
				.addRole('cta', '#ee2244')
				.addVariant('hover', { from: 'strong' })
				.addToken('ring', { from: 'cta.hover' }),
		);
		const keys = lightKeys(result);
		expect(keys).toContain('cta');
		expect(keys).toContain('cta-hover');
		expect(keys).toContain('ring');
	});

	it('addToken derived from another addToken', () => {
		const result = formatObject(
			hextimate('#ff6600')
				.addToken('chart-1', { from: 'accent' })
				.addToken('chart-2', { from: 'chart-1', lightness: -0.05 }),
		);
		const keys = lightKeys(result);
		expect(keys).toContain('chart-1');
		expect(keys).toContain('chart-2');
		// chart-2 should be a different color than chart-1 due to lightness shift
		expect(result.light['chart-2']).not.toBe(result.light['chart-1']);
	});

	it('addToken chain throws on circular reference', () => {
		expect(() =>
			formatObject(
				hextimate('#ff6600')
					.addToken('a', { from: 'b' })
					.addToken('b', { from: 'a' }),
			),
		).toThrow(/[Cc]ircular/);
	});

	it('theme adjustments + roles + variants', () => {
		const result = formatObject(
			hextimate('#ff6600')
				.style({
					light: { baseLightness: 0.75 },
					dark: { baseLightness: 0.55 },
				})
				.addRole('cta', '#ee2244')
				.addVariant('hover', { from: 'strong' }),
		);
		expect(lightKeys(result)).toContain('cta-hover');
	});

	it('fork → add more operations on fork', () => {
		const original = hextimate('#ff6600').addRole('cta', '#ee2244');
		const forked = original
			.fork('#0000ff')
			.addRole('info', '#3366cc')
			.addVariant('hover', { from: 'strong' });

		const baseResult = formatObject(original);
		const forkResult = formatObject(forked);

		// Base should not have info or hover
		expect(lightKeys(baseResult)).not.toContain('info');
		expect(lightKeys(baseResult)).not.toContain('accent-hover');
		// Fork should have both cta (inherited) and info (new)
		expect(lightKeys(forkResult)).toContain('cta');
		expect(lightKeys(forkResult)).toContain('info');
		expect(lightKeys(forkResult)).toContain('accent-hover');
	});
});

// ──────────────────────────────────────────────
// 11. Determinism
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: determinism', () => {
	it('same input produces same output', () => {
		const a = formatObject(hextimate('#ff6600'));
		const b = formatObject(hextimate('#ff6600'));
		expect(a).toEqual(b);
	});

	it('same input with same options produces same output', () => {
		const opts = { hueShift: 10, minContrastRatio: 'AA' as const };
		const a = formatObject(hextimate('#ff6600').style(opts));
		const b = formatObject(hextimate('#ff6600').style(opts));
		expect(a).toEqual(b);
	});

	it('format can be called multiple times with same result', () => {
		const builder = hextimate('#ff6600')
			.addRole('cta', '#ee2244')
			.addVariant('hover', { from: 'strong' });
		const first = formatObject(builder);
		const second = formatObject(builder);
		expect(first).toEqual(second);
	});
});

// ──────────────────────────────────────────────
// 12. Edge cases
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: edge cases', () => {
	it('works with various color input formats', () => {
		// Hex
		expect(() => hextimate('#ff6600').format()).not.toThrow();
		// RGB tuple
		expect(() => hextimate([255, 102, 0]).format()).not.toThrow();
		// Numeric
		expect(() => hextimate(0xff6600).format()).not.toThrow();
		// CSS function
		expect(() => hextimate('rgb(255, 102, 0)').format()).not.toThrow();
		// HSL
		expect(() => hextimate('hsl(24, 100%, 50%)').format()).not.toThrow();
	});

	it('near-black input produces valid palette', () => {
		const result = formatObject(hextimate('#010101'));
		expect(result.light.accent).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.dark.accent).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('near-white input produces valid palette', () => {
		const result = formatObject(hextimate('#fefefe'));
		expect(result.light.accent).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.dark.accent).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('pure gray input produces valid palette', () => {
		const result = formatObject(hextimate('#808080'));
		expect(result.light.accent).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('throws on invalid color input', () => {
		expect(() => hextimate('notacolor')).toThrow();
	});

	it('addToken with chroma offset', () => {
		const result = formatObject(
			hextimate('#ff6600').addToken('muted', {
				from: 'accent',
				chroma: -0.05,
			}),
		);
		expect(result.light.muted).toMatch(/^#[0-9a-f]{6}$/);
	});
});

// ──────────────────────────────────────────────
// invertedVariants
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: invertedVariants', () => {
	it('emits an -inverted copy for every role and variant in object output', () => {
		const base = hextimate('#ff6600').format({
			as: 'object',
			colors: 'hex',
		}) as { light: Record<string, string>; dark: Record<string, string> };
		const result = hextimate('#ff6600').format({
			as: 'object',
			colors: 'hex',
			invertedVariants: true,
		}) as { light: Record<string, string>; dark: Record<string, string> };

		for (const role of [
			'surface',
			'accent',
			'positive',
			'negative',
			'caution',
		]) {
			for (const variant of ['', '-strong', '-weak', '-foreground']) {
				const key = `${role}${variant}`;
				// Light block carries dark values under -inverted
				expect(result.light[`${key}-inverted`]).toBe(base.dark[key]);
				// Dark block carries light values under -inverted
				expect(result.dark[`${key}-inverted`]).toBe(base.light[key]);
			}
		}
	});

	it('inverted value differs from the regular value within the same block', () => {
		const result = hextimate('#6A5ACD').format({
			as: 'object',
			colors: 'hex',
			invertedVariants: true,
		}) as { light: Record<string, string>; dark: Record<string, string> };

		expect(result.light.surface).not.toBe(result.light['surface-inverted']);
		expect(result.dark.surface).not.toBe(result.dark['surface-inverted']);
	});

	it('inverted value in light equals the regular value in dark (and vice versa)', () => {
		const result = hextimate('#6A5ACD').format({
			as: 'object',
			colors: 'hex',
			invertedVariants: true,
		}) as { light: Record<string, string>; dark: Record<string, string> };

		expect(result.light['accent-inverted']).toBe(result.dark.accent);
		expect(result.dark['accent-inverted']).toBe(result.light.accent);
		expect(result.light['surface-strong-inverted']).toBe(
			result.dark['surface-strong'],
		);
	});

	it('does not emit -inverted keys when invertedVariants is false', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			colors: 'hex',
		}) as { light: Record<string, string>; dark: Record<string, string> };

		for (const key of Object.keys(result.light)) {
			expect(key.endsWith('-inverted')).toBe(false);
		}
	});

	it('includes standalone tokens in inverted output', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			colors: 'hex',
			invertedVariants: true,
		}) as { light: Record<string, string>; dark: Record<string, string> };

		expect(result.light['brand-exact-inverted']).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.light['brand-exact-foreground-inverted']).toMatch(
			/^#[0-9a-f]{6}$/,
		);
	});

	it('includes custom roles added via addRole in inverted output', () => {
		const result = hextimate('#ff6600').addRole('cta', '#ee2244').format({
			as: 'object',
			colors: 'hex',
			invertedVariants: true,
		}) as { light: Record<string, string>; dark: Record<string, string> };

		expect(result.light['cta-inverted']).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.light['cta-strong-inverted']).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.light['cta-foreground-inverted']).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('respects excludeRoles and excludeVariants for inverted entries', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			colors: 'hex',
			invertedVariants: true,
			excludeRoles: ['caution'],
			excludeVariants: ['weak'],
		}) as { light: Record<string, string>; dark: Record<string, string> };

		const keys = Object.keys(result.light);
		expect(keys.some((k) => k.startsWith('caution-'))).toBe(false);
		expect(keys.some((k) => k === 'caution-inverted')).toBe(false);
		expect(
			keys.some(
				(k) =>
					k.includes('-weak-inverted') &&
					!k.includes('-foreground-weak-inverted'),
			),
		).toBe(false);
		// Excluding "weak" must not drop the distinct foreground-weak variant.
		expect(result.light['accent-foreground-weak-inverted']).toMatch(
			/^#[0-9a-f]{6}$/,
		);
		expect(result.light['accent-inverted']).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('respects custom separator in inverted keys', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			colors: 'hex',
			invertedVariants: true,
			separator: '_',
		}) as { light: Record<string, string>; dark: Record<string, string> };

		expect(result.light.accent_inverted).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.light.accent_strong_inverted).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('respects roleNames and variantNames remapping in inverted keys', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			colors: 'hex',
			invertedVariants: true,
			roleNames: { accent: 'brand' },
			variantNames: { strong: 'primary' },
		}) as { light: Record<string, string>; dark: Record<string, string> };

		expect(result.light['brand-inverted']).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.light['brand-primary-inverted']).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.light['accent-inverted']).toBeUndefined();
		expect(result.light['brand-strong-inverted']).toBeUndefined();
	});

	it('tailwind format nests inverted entries under the role key', () => {
		const result = hextimate('#ff6600').format({
			as: 'tailwind',
			colors: 'hex',
			invertedVariants: true,
		}) as {
			light: Record<string, Record<string, string>>;
			dark: Record<string, Record<string, string>>;
		};

		expect(result.light.accent.inverted).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.light.accent['strong-inverted']).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.light.accent['foreground-inverted']).toMatch(
			/^#[0-9a-f]{6}$/,
		);
	});

	it('scss format prefixes inverted keys with $', () => {
		const result = hextimate('#ff6600').format({
			as: 'scss',
			colors: 'hex',
			invertedVariants: true,
		}) as { light: Record<string, string>; dark: Record<string, string> };

		expect(result.light['$accent-inverted']).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.light['$accent-strong-inverted']).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('css stylesheet emits -inverted in both root and dark blocks with swapped values', () => {
		const base = hextimate('#ff6600').format({
			as: 'object',
			colors: 'hex',
		}) as { light: Record<string, string>; dark: Record<string, string> };
		const css = hextimate('#ff6600').format({
			as: 'css',
			invertedVariants: true,
			darkMode: 'class',
		}) as string;

		const [rootBlock, darkBlock] = css.split('.dark {');
		expect(rootBlock).toContain(`--accent-inverted: ${base.dark.accent};`);
		expect(darkBlock).toBeDefined();
		expect(darkBlock).toContain(`--accent-inverted: ${base.light.accent};`);
		expect(rootBlock).toContain(
			`--accent-strong-inverted: ${base.dark['accent-strong']};`,
		);
		expect(darkBlock).toContain(
			`--accent-strong-inverted: ${base.light['accent-strong']};`,
		);
	});

	it('css stylesheet @media dark redefines inverted vars with light values', () => {
		const base = hextimate('#ff6600').format({
			as: 'object',
			colors: 'hex',
		}) as { light: Record<string, string>; dark: Record<string, string> };
		const css = hextimate('#ff6600').format({
			as: 'css',
			invertedVariants: true,
		}) as string;

		const mediaIdx = css.indexOf('@media (prefers-color-scheme: dark)');
		expect(mediaIdx).toBeGreaterThan(-1);
		const rootBlock = css.slice(0, mediaIdx);
		const mediaBlock = css.slice(mediaIdx);

		expect(rootBlock).toContain(`--accent-inverted: ${base.dark.accent};`);
		expect(mediaBlock).toContain(`--accent-inverted: ${base.light.accent};`);
	});

	it('tailwind-css stylesheet emits inverted vars in both blocks', () => {
		const css = hextimate('#ff6600').format({
			as: 'tailwind-css',
			invertedVariants: true,
			darkMode: 'class',
		}) as string;

		const [themeBlock, darkBlock] = css.split('.dark {');
		expect(themeBlock).toContain('--color-accent-inverted:');
		expect(darkBlock).toBeDefined();
		expect(darkBlock).toContain('--color-accent-inverted:');
	});

	it('darkMode: false still emits inverted vars (one block, dark values under -inverted)', () => {
		const base = hextimate('#ff6600').format({
			as: 'object',
			colors: 'hex',
		}) as { light: Record<string, string>; dark: Record<string, string> };
		const css = hextimate('#ff6600').format({
			as: 'css',
			invertedVariants: true,
			darkMode: false,
		}) as string;

		expect(css).toContain(`--accent-inverted: ${base.dark.accent};`);
		expect(css).not.toContain('@media');
		expect(css).not.toContain('.dark');
	});
});
