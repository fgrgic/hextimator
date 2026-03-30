import { describe, expect, it } from 'bun:test';
import { hextimate } from './index';
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
		expect(builder.light).toBeFunction();
		expect(builder.dark).toBeFunction();
		expect(builder.simulate).toBeFunction();
		expect(builder.adaptFor).toBeFunction();
		expect(builder.preset).toBeFunction();
	});

	it('produces light and dark themes by default', () => {
		const result = hextimate('#ff6600').format();
		expect(result).toHaveProperty('light');
		expect(result).toHaveProperty('dark');
	});

	it('default palette has base, accent, positive, negative, warning roles', () => {
		const result = formatObject(hextimate('#ff6600'));
		const keys = lightKeys(result);
		for (const role of ['base', 'accent', 'positive', 'negative', 'warning']) {
			expect(keys).toContain(role);
			expect(keys).toContain(`${role}-strong`);
			expect(keys).toContain(`${role}-weak`);
			expect(keys).toContain(`${role}-foreground`);
		}
	});

	it('all methods return this for chaining', () => {
		const builder = hextimate('#ff6600');
		expect(builder.addRole('cta', '#ee2244')).toBe(builder);
		expect(builder.addVariant('hover', { beyond: 'strong' })).toBe(builder);
		expect(builder.addToken('brand', '#000')).toBe(builder);
		expect(builder.light({ lightness: 0.8 })).toBe(builder);
		expect(builder.dark({ lightness: 0.5 })).toBe(builder);
		expect(builder.simulate('deuteranopia')).toBe(builder);
		expect(builder.adaptFor('protanopia')).toBe(builder);
	});
});

// ──────────────────────────────────────────────
// 2. format() output formats
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: format()', () => {
	it('css format prefixes keys with --', () => {
		const result = hextimate('#ff6600').format({ as: 'css' });
		const keys = Object.keys(result.light);
		expect(keys.every((k) => k.startsWith('--'))).toBe(true);
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

	it('tailwind-css format returns a string', () => {
		const result = hextimate('#ff6600').format({ as: 'tailwind-css' });
		expect(typeof result.light).toBe('string');
		expect((result.light as string)).toContain('@theme');
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
			hextimate('#ff6600')
				.addRole('cta', '#ee2244')
				.addRole('info', '#3366cc'),
		);
		const keys = lightKeys(result);
		expect(keys).toContain('cta');
		expect(keys).toContain('info');
	});
});

// ──────────────────────────────────────────────
// 4. addVariant
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: addVariant()', () => {
	it('beyond variant appears on all roles', () => {
		const result = formatObject(
			hextimate('#ff6600').addVariant('hover', { beyond: 'strong' }),
		);
		const keys = lightKeys(result);
		for (const role of ['accent', 'base', 'positive', 'negative', 'warning']) {
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
		for (const role of ['accent', 'base']) {
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
				.addVariant('hover', { beyond: 'strong' }),
		);
		expect(lightKeys(result)).toContain('cta-hover');
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
			hextimate('#ff6600').addToken('surface', {
				light: { from: 'base.weak', lightness: 0.05 },
				dark: { from: 'base.weak', lightness: -0.05 },
			}),
		);
		expect(result.light.surface).not.toBe(result.dark.surface);
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
});

// ──────────────────────────────────────────────
// 6. light() / dark() theme adjustments
// ──────────────────────────────────────────────
describe('HextimatePaletteBuilder: light() / dark()', () => {
	it('light adjustments change light theme output', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600').light({ lightness: 0.8 }),
		);
		expect(adjusted.light.accent).not.toBe(normal.light.accent);
	});

	it('light adjustments do not change dark theme', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600').light({ lightness: 0.8 }),
		);
		expect(adjusted.dark.accent).toBe(normal.dark.accent);
	});

	it('dark adjustments change dark theme output', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600').dark({ lightness: 0.5 }),
		);
		expect(adjusted.dark.accent).not.toBe(normal.dark.accent);
	});

	it('dark adjustments do not change light theme', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600').dark({ lightness: 0.5 }),
		);
		expect(adjusted.light.accent).toBe(normal.light.accent);
	});

	it('maxChroma adjustment affects output', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600').light({ maxChroma: 0.05 }),
		);
		// With heavily clamped chroma, the color should be different
		expect(adjusted.light.accent).not.toBe(normal.light.accent);
	});

	it('adjustments are preserved when operations are added after', () => {
		const result = formatObject(
			hextimate('#ff6600')
				.light({ lightness: 0.8 })
				.addRole('cta', '#ee2244'),
		);
		expect(result.light.cta).toBeDefined();
	});

	it('per-theme minContrastRatio override affects only that theme', () => {
		const global = formatObject(
			hextimate('#ff6600', { minContrastRatio: 'AAA' }),
		);
		const overridden = formatObject(
			hextimate('#ff6600', {
				minContrastRatio: 'AAA',
				light: { minContrastRatio: 'AA' },
			}),
		);
		// Light theme should differ (relaxed contrast)
		expect(overridden.light.accent).not.toBe(global.light.accent);
		// Dark theme unchanged (still AAA)
		expect(overridden.dark.accent).toBe(global.dark.accent);
	});

	it('per-theme baseMaxChroma override affects only that theme', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600', {
				dark: { baseMaxChroma: 0.06 },
			}),
		);
		// Dark base colors should be more chromatic
		expect(adjusted.dark.base).not.toBe(normal.dark.base);
		// Light base colors unchanged
		expect(adjusted.light.base).toBe(normal.light.base);
	});

	it('per-theme foregroundMaxChroma override affects only that theme', () => {
		const normal = formatObject(hextimate('#ff6600'));
		const adjusted = formatObject(
			hextimate('#ff6600', {
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

	it('per-theme overrides via .light()/.dark() methods work the same', () => {
		const viaOptions = formatObject(
			hextimate('#ff6600', {
				dark: { baseMaxChroma: 0.06 },
			}),
		);
		const viaMethod = formatObject(
			hextimate('#ff6600').dark({ baseMaxChroma: 0.06 }),
		);
		expect(viaMethod.dark.base).toBe(viaOptions.dark.base);
		expect(viaMethod.light.base).toBe(viaOptions.light.base);
	});

	it('per-theme override takes precedence over global value', () => {
		const globalOnly = formatObject(
			hextimate('#ff6600', { baseMaxChroma: 0.06 }),
		);
		const withOverride = formatObject(
			hextimate('#ff6600', {
				baseMaxChroma: 0.06,
				light: { baseMaxChroma: 0.01 },
			}),
		);
		// Light uses override (0.01), so differs from global-only (0.06)
		expect(withOverride.light.base).not.toBe(globalOnly.light.base);
		// Dark uses global (0.06), so matches
		expect(withOverride.dark.base).toBe(globalOnly.dark.base);
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
			beyond: 'strong',
		});
		const forked = builder.fork('#0000ff');
		expect(lightKeys(formatObject(forked))).toContain('accent-hover');
	});

	it('fork preserves addToken operations', () => {
		const builder = hextimate('#ff6600').addToken('brand', '#000');
		const forked = builder.fork('#0000ff');
		expect(formatObject(forked).light.brand).toBeDefined();
	});

	it('fork preserves theme adjustments', () => {
		const builder = hextimate('#ff6600').light({ lightness: 0.8 });
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

	it('fork with options overrides generation options', () => {
		const builder = hextimate('#ff6600');
		const forked = builder.fork({ light: { lightness: 0.85 } });
		const normal = formatObject(builder);
		const forkedResult = formatObject(forked);
		expect(forkedResult.light.accent).not.toBe(normal.light.accent);
	});

	it('fork with color and options', () => {
		const builder = hextimate('#ff6600');
		const forked = builder.fork('#0000ff', { light: { lightness: 0.85 } });
		const result = formatObject(forked);
		expect(result.light.accent).toBeDefined();
		// Should differ from both the original color and default lightness
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
		const adapted = formatObject(
			hextimate('#ff6600').adaptFor('deuteranopia'),
		);
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
		variants: [{ name: 'hover', placement: { beyond: 'strong' } }],
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
		const keys = Object.keys(result.light);
		// Preset sets as: 'css', so keys should have --
		expect(keys.some((k) => k.startsWith('--'))).toBe(true);
		// Preset renames accent → primary
		expect(keys).toContain('--primary');
	});

	it('format options override preset defaults', () => {
		const result = hextimate('#6366f1')
			.preset(customPreset)
			.format({ as: 'object', colors: 'hex' });
		const light = result.light as Record<string, string>;
		// as: 'object' overrides as: 'css'
		expect(Object.keys(light).some((k) => k.startsWith('--'))).toBe(false);
		// colors: 'hex' overrides colors: 'oklch'
		expect(light.base).toMatch(/^#/);
	});

	it('multiple presets can be applied sequentially', () => {
		const preset1: HextimatePreset = {
			roles: [{ name: 'info', color: '#3366cc' }],
		};
		const preset2: HextimatePreset = {
			tokens: [{ name: 'surface', value: '#fafafa' }],
		};
		const result = formatObject(
			hextimate('#6366f1').preset(preset1).preset(preset2),
		);
		expect(lightKeys(result)).toContain('info');
		expect(lightKeys(result)).toContain('surface');
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
				.addVariant('hover', { beyond: 'strong' })
				.addToken('ring', { from: 'cta.hover' }),
		);
		const keys = lightKeys(result);
		expect(keys).toContain('cta');
		expect(keys).toContain('cta-hover');
		expect(keys).toContain('ring');
	});

	it('theme adjustments + roles + variants', () => {
		const result = formatObject(
			hextimate('#ff6600')
				.light({ lightness: 0.75 })
				.dark({ lightness: 0.55 })
				.addRole('cta', '#ee2244')
				.addVariant('hover', { beyond: 'strong' }),
		);
		expect(lightKeys(result)).toContain('cta-hover');
	});

	it('fork → add more operations on fork', () => {
		const base = hextimate('#ff6600').addRole('cta', '#ee2244');
		const forked = base
			.fork('#0000ff')
			.addRole('info', '#3366cc')
			.addVariant('hover', { beyond: 'strong' });

		const baseResult = formatObject(base);
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
		const a = formatObject(hextimate('#ff6600', opts));
		const b = formatObject(hextimate('#ff6600', opts));
		expect(a).toEqual(b);
	});

	it('format can be called multiple times with same result', () => {
		const builder = hextimate('#ff6600')
			.addRole('cta', '#ee2244')
			.addVariant('hover', { beyond: 'strong' });
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
