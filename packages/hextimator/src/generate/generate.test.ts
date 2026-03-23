import { describe, expect, it } from 'bun:test';
import { convert } from '../convert';
import { hextimate } from '../index';
import { parse } from '../parse';
import type { ColorInput } from '../types';
import { calculateContrast } from './utils';

/**
 * Helper: compute WCAG contrast ratio between two ColorInput values.
 */
function contrast(a: ColorInput, b: ColorInput) {
	return calculateContrast(parse(a), parse(b));
}

/**
 * A spread of input colors that cover very different hues / lightness extremes.
 * Tests run against every color to ensure the guarantees are hue-independent.
 */
const TEST_COLORS = [
	'#0000ff', // blue  – notoriously dark in sRGB
	'#ffff00', // yellow – very light
	'#ff0000', // red
	'#00ff00', // green
	'#ff6600', // orange
	'#800080', // purple – mid-range
	'#00cccc', // teal
	'#111111', // near-black
	'#eeeeee', // near-white
] as const;

const THEME_TYPES = ['light', 'dark'] as const;

const MIN_CONTRAST = 7; // WCAG AAA

// ──────────────────────────────────────────────
// 1. Contrast: every non-foreground variant ≥ 7 with the foreground
// ──────────────────────────────────────────────
describe('contrast: all variants meet AAA with foreground', () => {
	for (const color of TEST_COLORS) {
		for (const theme of THEME_TYPES) {
			it(`${color} – ${theme}`, () => {
				const result = hextimate(color).format({ as: 'object', colors: 'hex' });
				const palette = result[theme] as Record<string, string>;

				const roleScales = groupByRole(palette);

				for (const [role, scale] of Object.entries(roleScales)) {
					const fg = scale.foreground;
					if (!fg) continue;

					for (const [variant, value] of Object.entries(scale)) {
						if (variant === 'foreground') continue;
						const cr = contrast(value, fg);
						if (cr < MIN_CONTRAST) {
							throw new Error(
								`${role}.${variant} (${value}) vs foreground (${fg}) = ${cr.toFixed(2)} in ${theme} theme for ${color}`,
							);
						}
					}
				}
			});
		}
	}
});

// ──────────────────────────────────────────────
// 2. Adding extra variants still meets AAA
// ──────────────────────────────────────────────
describe('contrast: added variants still meet AAA with foreground', () => {
	for (const color of TEST_COLORS) {
		for (const theme of THEME_TYPES) {
			it(`${color} – ${theme} (beyond strong + between)`, () => {
				const result = hextimate(color)
					.addVariant('stronger', { beyond: 'strong' })
					.addVariant('weaker', { beyond: 'weak' })
					.addVariant('mid', { between: ['DEFAULT', 'strong'] })
					.format({ as: 'object', colors: 'hex' });

				const palette = result[theme] as Record<string, string>;
				const roleScales = groupByRole(palette);

				for (const [role, scale] of Object.entries(roleScales)) {
					const fg = scale.foreground;
					if (!fg) continue;

					for (const [variant, value] of Object.entries(scale)) {
						if (variant === 'foreground') continue;
						const cr = contrast(value, fg);
						if (cr < MIN_CONTRAST) {
							throw new Error(
								`${role}.${variant} (${value}) vs foreground (${fg}) = ${cr.toFixed(2)} in ${theme} theme for ${color}`,
							);
						}
					}
				}
			});
		}
	}
});

// ──────────────────────────────────────────────
// 3. Strong is closer to foreground than weak (perceptual ordering)
//    Strong moves toward the foreground, weak moves away. We verify
//    this by comparing OKLCH lightness distances to the foreground.
// ──────────────────────────────────────────────
describe('lightness ordering: strong has more contrast with base than weak', () => {
	for (const color of TEST_COLORS) {
		for (const theme of THEME_TYPES) {
			it(`${color} – ${theme}`, () => {
				const builder = hextimate(color);
				const result = builder.format({ as: 'object', colors: 'hex' });
				const palette = result[theme] as Record<string, string>;
				const roleScales = groupByRole(palette);

				const baseL = convert(parse(palette.base), 'oklch').l;

				for (const [role, scale] of Object.entries(roleScales)) {
					if (role === 'base') continue;
					if (
						!scale.strong ||
						!scale.weak ||
						!scale.DEFAULT ||
						!scale.foreground
					)
						continue;

					const strongL = convert(parse(scale.strong), 'oklch').l;
					const weakL = convert(parse(scale.weak), 'oklch').l;

					const strongDistToBase = Math.abs(strongL - baseL);
					const weakDistToBase = Math.abs(weakL - baseL);

					if (strongDistToBase < weakDistToBase) {
						throw new Error(
							`${role}: strong (dist=${strongDistToBase.toFixed(4)}) should have more contrast with base than weak (dist=${weakDistToBase.toFixed(4)}) in ${theme} for ${color}`,
						);
					}
				}
			});
		}
	}
});

// ──────────────────────────────────────────────
// 4. addToken: value is independent of main input color
// ──────────────────────────────────────────────
describe('addToken: value does not change with input color', () => {
	it('explicit color token stays the same across different inputs', () => {
		const tokenColor = '#cc3366';

		const results = TEST_COLORS.map((color) =>
			hextimate(color)
				.addToken('brand', tokenColor)
				.format({ as: 'object', colors: 'hex' }),
		);

		const firstLight = (results[0].light as Record<string, string>).brand;
		const firstDark = (results[0].dark as Record<string, string>).brand;

		for (const result of results.slice(1)) {
			expect((result.light as Record<string, string>).brand).toBe(firstLight);
			expect((result.dark as Record<string, string>).brand).toBe(firstDark);
		}
	});

	it('derived token referencing a fixed role stays the same across inputs', () => {
		const roleColor = '#22aa44';

		const results = TEST_COLORS.map((color) =>
			hextimate(color)
				.addRole('fixed', roleColor)
				.addToken('fixedBright', { from: 'fixed.DEFAULT', lightness: 0.05 })
				.format({ as: 'object', colors: 'hex' }),
		);

		const firstLight = (results[0].light as Record<string, string>).fixedBright;
		const firstDark = (results[0].dark as Record<string, string>).fixedBright;

		for (const result of results.slice(1)) {
			expect((result.light as Record<string, string>).fixedBright).toBe(
				firstLight,
			);
			expect((result.dark as Record<string, string>).fixedBright).toBe(
				firstDark,
			);
		}
	});
});

// ──────────────────────────────────────────────
// 5. addRole: role values are independent of main input color
// ──────────────────────────────────────────────
describe('addRole: values do not change with input color', () => {
	it('custom role produces identical scales regardless of input color', () => {
		const roleColor = '#3366cc';

		const results = TEST_COLORS.map((color) =>
			hextimate(color)
				.addRole('custom', roleColor)
				.format({ as: 'object', colors: 'hex' }),
		);

		const firstLight = extractRole(
			results[0].light as Record<string, string>,
			'custom',
		);
		const firstDark = extractRole(
			results[0].dark as Record<string, string>,
			'custom',
		);

		for (const result of results.slice(1)) {
			expect(
				extractRole(result.light as Record<string, string>, 'custom'),
			).toEqual(firstLight);
			expect(
				extractRole(result.dark as Record<string, string>, 'custom'),
			).toEqual(firstDark);
		}
	});
});

// ──────────────────────────────────────────────
// 6. addVariant: adds to all roles, but NOT to tokens
// ──────────────────────────────────────────────
describe('addVariant: applies to roles, not tokens', () => {
	it('new variant appears on every role', () => {
		const result = hextimate('#ff6600')
			.addVariant('stronger', { beyond: 'strong' })
			.format({ as: 'object', colors: 'hex' });

		const lightScales = groupByRole(result.light as Record<string, string>);

		const defaultRoles = ['base', 'accent', 'positive', 'negative', 'warning'];

		for (const role of defaultRoles) {
			expect(lightScales[role]?.stronger).toBeDefined();
		}
	});

	it('new variant does NOT appear on standalone tokens', () => {
		const result = hextimate('#ff6600')
			.addToken('surface', '#fafafa')
			.addVariant('stronger', { beyond: 'strong' })
			.format({ as: 'object', colors: 'hex' });

		const tokens = result.light as Record<string, string>;

		// Token "surface" should exist as a flat value
		expect(tokens.surface).toBeDefined();
		// But "surface-stronger" should not
		expect(tokens['surface-stronger']).toBeUndefined();
	});
});

// ──────────────────────────────────────────────
// 7. minContrastRatio option
// ──────────────────────────────────────────────
describe('minContrastRatio', () => {
	it('"AA" enforces 4.5 contrast with foreground', () => {
		for (const color of TEST_COLORS) {
			for (const theme of THEME_TYPES) {
				const result = hextimate(color, { minContrastRatio: 'AA' }).format({
					as: 'object',
					colors: 'hex',
				});
				const palette = result[theme] as Record<string, string>;
				const roleScales = groupByRole(palette);

				for (const [role, scale] of Object.entries(roleScales)) {
					const fg = scale.foreground;
					if (!fg) continue;

					for (const [variant, value] of Object.entries(scale)) {
						if (variant === 'foreground') continue;
						const cr = contrast(value, fg);
						if (cr < 4.5) {
							throw new Error(
								`${role}.${variant} (${value}) vs foreground (${fg}) = ${cr.toFixed(2)} in ${theme} for ${color}`,
							);
						}
					}
				}
			}
		}
	});

	it('numeric value is respected', () => {
		for (const color of TEST_COLORS) {
			for (const theme of THEME_TYPES) {
				const result = hextimate(color, { minContrastRatio: 3 }).format({
					as: 'object',
					colors: 'hex',
				});
				const palette = result[theme] as Record<string, string>;
				const roleScales = groupByRole(palette);

				for (const [role, scale] of Object.entries(roleScales)) {
					const fg = scale.foreground;
					if (!fg) continue;

					for (const [variant, value] of Object.entries(scale)) {
						if (variant === 'foreground') continue;
						const cr = contrast(value, fg);
						if (cr < 3) {
							throw new Error(
								`${role}.${variant} (${value}) vs foreground (${fg}) = ${cr.toFixed(2)} in ${theme} for ${color}`,
							);
						}
					}
				}
			}
		}
	});

	it('defaults to AAA (7) when omitted', () => {
		const result = hextimate('#ff1414').format({
			as: 'object',
			colors: 'hex',
		});
		const palette = result.light as Record<string, string>;
		const roleScales = groupByRole(palette);

		for (const [role, scale] of Object.entries(roleScales)) {
			const fg = scale.foreground;
			if (!fg) continue;

			for (const [variant, value] of Object.entries(scale)) {
				if (variant === 'foreground') continue;
				const cr = contrast(value, fg);
				if (cr < 7) {
					throw new Error(
						`${role}.${variant} (${value}) vs foreground (${fg}) = ${cr.toFixed(2)} — should default to AAA`,
					);
				}
			}
		}
	});
});

// ──────────────────────────────────────────────
// 8. hueShift
// ──────────────────────────────────────────────
describe('hueShift: all variants still meet AAA with foreground', () => {
	const HUE_SHIFTS = [1, 5, 15, 30, 60, 120];

	for (const color of TEST_COLORS) {
		for (const theme of THEME_TYPES) {
			for (const shift of HUE_SHIFTS) {
				it(`${color} – ${theme} – hueShift: ${shift}`, () => {
					const result = hextimate(color, { hueShift: shift }).format({
						as: 'object',
						colors: 'hex',
					});
					const palette = result[theme] as Record<string, string>;
					const roleScales = groupByRole(palette);

					for (const [role, scale] of Object.entries(roleScales)) {
						const fg = scale.foreground;
						if (!fg) continue;

						for (const [variant, value] of Object.entries(scale)) {
							if (variant === 'foreground') continue;
							const cr = contrast(value, fg);
							if (cr < MIN_CONTRAST) {
								throw new Error(
									`${role}.${variant} (${value}) vs foreground (${fg}) = ${cr.toFixed(2)} in ${theme} theme for ${color} with hueShift: ${shift}`,
								);
							}
						}
					}
				});
			}
		}
	}
});

describe('hueShift: negative values flip direction', () => {
	for (const color of TEST_COLORS) {
		for (const theme of THEME_TYPES) {
			it(`${color} – ${theme} – hueShift: -10`, () => {
				const result = hextimate(color, { hueShift: -10 }).format({
					as: 'object',
					colors: 'hex',
				});
				const palette = result[theme] as Record<string, string>;
				const roleScales = groupByRole(palette);

				for (const [role, scale] of Object.entries(roleScales)) {
					const fg = scale.foreground;
					if (!fg) continue;

					for (const [variant, value] of Object.entries(scale)) {
						if (variant === 'foreground') continue;
						const cr = contrast(value, fg);
						if (cr < MIN_CONTRAST) {
							throw new Error(
								`${role}.${variant} (${value}) vs foreground (${fg}) = ${cr.toFixed(2)} in ${theme} theme for ${color} with hueShift: -10`,
							);
						}
					}
				}
			});
		}
	}
});

describe('hueShift: added variants still meet AAA', () => {
	const HUE_SHIFTS = [5, 20, 60];

	for (const color of TEST_COLORS) {
		for (const theme of THEME_TYPES) {
			for (const shift of HUE_SHIFTS) {
				it(`${color} – ${theme} – hueShift: ${shift} (beyond + between)`, () => {
					const result = hextimate(color, { hueShift: shift })
						.addVariant('stronger', { beyond: 'strong' })
						.addVariant('weaker', { beyond: 'weak' })
						.addVariant('mid', { between: ['DEFAULT', 'strong'] })
						.format({ as: 'object', colors: 'hex' });

					const palette = result[theme] as Record<string, string>;
					const roleScales = groupByRole(palette);

					for (const [role, scale] of Object.entries(roleScales)) {
						const fg = scale.foreground;
						if (!fg) continue;

						for (const [variant, value] of Object.entries(scale)) {
							if (variant === 'foreground') continue;
							const cr = contrast(value, fg);
							if (cr < MIN_CONTRAST) {
								throw new Error(
									`${role}.${variant} (${value}) vs foreground (${fg}) = ${cr.toFixed(2)} in ${theme} theme for ${color} with hueShift: ${shift}`,
								);
							}
						}
					}
				});
			}
		}
	}
});

describe('hueShift: hue actually shifts between variants', () => {
	it('strong and weak have different hues from DEFAULT when hueShift > 0', () => {
		const result = hextimate('#6366f1', { hueShift: 10 }).format({
			as: 'object',
			colors: 'oklch',
		});

		for (const theme of THEME_TYPES) {
			const palette = result[theme] as Record<string, string>;
			const roleScales = groupByRole(palette);

			for (const role of ['accent', 'positive', 'negative', 'warning']) {
				const scale = roleScales[role];
				if (!scale?.DEFAULT || !scale.strong || !scale.weak) continue;

				const defaultH = parseOklchHue(scale.DEFAULT);
				const strongH = parseOklchHue(scale.strong);
				const weakH = parseOklchHue(scale.weak);

				// Strong shifts positive, weak shifts negative
				expect(strongH).not.toBeCloseTo(defaultH, 0);
				expect(weakH).not.toBeCloseTo(defaultH, 0);
				// Strong and weak shift in opposite directions
				const strongDiff = hueDiff(strongH, defaultH);
				const weakDiff = hueDiff(weakH, defaultH);
				expect(Math.sign(strongDiff)).not.toBe(Math.sign(weakDiff));
			}
		}
	});

	it('hueShift: 0 keeps all variants at the same hue', () => {
		const result = hextimate('#6366f1', { hueShift: 0 }).format({
			as: 'object',
			colors: 'oklch',
		});

		for (const theme of THEME_TYPES) {
			const palette = result[theme] as Record<string, string>;
			const roleScales = groupByRole(palette);

			for (const role of ['accent']) {
				const scale = roleScales[role];
				if (!scale?.DEFAULT || !scale.strong || !scale.weak) continue;

				const defaultH = parseOklchHue(scale.DEFAULT);
				const strongH = parseOklchHue(scale.strong);
				const weakH = parseOklchHue(scale.weak);

				expect(strongH).toBeCloseTo(defaultH, 0);
				expect(weakH).toBeCloseTo(defaultH, 0);
			}
		}
	});
});

describe('hueShift: clamping to 360/(n+1)', () => {
	it('extreme hueShift is clamped so palette stays bounded', () => {
		// With 2 default variants (strong, weak), max = 360/3 = 120
		const result = hextimate('#6366f1', { hueShift: 999 }).format({
			as: 'object',
			colors: 'oklch',
		});

		for (const theme of THEME_TYPES) {
			const palette = result[theme] as Record<string, string>;
			const roleScales = groupByRole(palette);

			for (const role of ['accent']) {
				const scale = roleScales[role];
				if (!scale?.DEFAULT || !scale.strong) continue;

				const defaultH = parseOklchHue(scale.DEFAULT);
				const strongH = parseOklchHue(scale.strong);

				// Shift should be clamped to 120 max
				const diff = Math.abs(hueDiff(strongH, defaultH));
				expect(diff).toBeLessThanOrEqual(121); // 120 + tolerance
			}
		}
	});

	it('clamping adjusts when more variants are added', () => {
		// When weaker is added (4 total variants), weak side uses max = 360/5 = 72
		const result = hextimate('#6366f1', { hueShift: 200 })
			.addVariant('stronger', { beyond: 'strong' })
			.addVariant('weaker', { beyond: 'weak' })
			.format({ as: 'object', colors: 'oklch' });

		for (const theme of THEME_TYPES) {
			const palette = result[theme] as Record<string, string>;
			const roleScales = groupByRole(palette);

			for (const role of ['accent']) {
				const scale = roleScales[role];
				if (!scale?.DEFAULT || !scale.weak || !scale.weaker) continue;

				const defaultH = parseOklchHue(scale.DEFAULT);
				const weakH = parseOklchHue(scale.weak);
				const weakerH = parseOklchHue(scale.weaker);

				// Weak side was last redistributed with 4 total → max = 72 per step
				const weakDiff = Math.abs(hueDiff(weakH, defaultH));
				const weakerDiff = Math.abs(hueDiff(weakerH, defaultH));
				expect(weakDiff).toBeLessThanOrEqual(73);
				expect(weakerDiff).toBeLessThanOrEqual(145);
				// weaker should shift more than weak
				expect(weakerDiff).toBeGreaterThan(weakDiff - 1);
			}
		}
	});
});

// ──────────────────────────────────────────────
// 9. addToken error paths
// ──────────────────────────────────────────────
describe('addToken: error paths', () => {
	it('throws when referencing an unknown role', () => {
		expect(() =>
			hextimate('#ff6600').addToken('bad', { from: 'nonexistent' }).format(),
		).toThrow('Unknown role "nonexistent"');
	});

	it('throws when referencing an unknown variant', () => {
		expect(() =>
			hextimate('#ff6600')
				.addToken('bad', { from: 'accent.nonexistent' })
				.format(),
		).toThrow('Unknown variant "nonexistent"');
	});

	it('throws for unknown role with theme-split token', () => {
		expect(() =>
			hextimate('#ff6600')
				.addToken('bad', {
					light: { from: 'ghost.DEFAULT' },
					dark: { from: 'accent' },
				})
				.format(),
		).toThrow('Unknown role "ghost"');
	});
});

// ──────────────────────────────────────────────
// 9. addVariant: invalid between references
// ──────────────────────────────────────────────
describe('addVariant: invalid between references', () => {
	it('throws when a between variant references a missing variant', () => {
		expect(() =>
			hextimate('#ff6600')
				.addVariant('mid', { between: ['DEFAULT', 'ghost'] })
				.format(),
		).toThrow();
	});
});

// ──────────────────────────────────────────────
// 10. End-to-end pipeline shape
// ──────────────────────────────────────────────
describe('end-to-end: output shape', () => {
	it('produces expected top-level roles by default', () => {
		const result = hextimate('#6366f1').format({ as: 'object', colors: 'hex' });

		for (const theme of ['light', 'dark'] as const) {
			const tokens = result[theme] as Record<string, string>;
			for (const role of [
				'accent',
				'base',
				'positive',
				'negative',
				'warning',
			]) {
				expect(tokens[role]).toMatch(/^#[0-9a-f]{6}$/);
				expect(tokens[`${role}-strong`]).toMatch(/^#[0-9a-f]{6}$/);
				expect(tokens[`${role}-weak`]).toMatch(/^#[0-9a-f]{6}$/);
				expect(tokens[`${role}-foreground`]).toMatch(/^#[0-9a-f]{6}$/);
			}
		}
	});

	it('light and dark DEFAULT values differ', () => {
		const result = hextimate('#6366f1').format({ as: 'object', colors: 'hex' });
		const light = result.light as Record<string, string>;
		const dark = result.dark as Record<string, string>;
		expect(light.accent).not.toBe(dark.accent);
		expect(light.base).not.toBe(dark.base);
	});
});

// ──────────────────────────────────────────────
// 11. baseHueShift
// ──────────────────────────────────────────────
describe('baseHueShift: rotates base hue relative to accent', () => {
	it('180 shifts base hue ~180° from accent', () => {
		const accentHue = convert(parse('#ff6600'), 'oklch').h;
		const result = hextimate('#ff6600', { baseHueShift: 180 }).format({
			as: 'object',
			colors: 'oklch',
		});

		for (const theme of THEME_TYPES) {
			const palette = result[theme] as Record<string, string>;
			const baseH = parseOklchHue(palette.base);
			const diff = Math.abs(hueDiff(baseH, accentHue));
			expect(diff).toBeGreaterThan(170);
			expect(diff).toBeLessThanOrEqual(180);
		}
	});

	it('30 shifts base hue ~+30° from accent', () => {
		const accentHue = convert(parse('#ff6600'), 'oklch').h;
		const result = hextimate('#ff6600', { baseHueShift: 30 }).format({
			as: 'object',
			colors: 'oklch',
		});

		for (const theme of THEME_TYPES) {
			const palette = result[theme] as Record<string, string>;
			const baseH = parseOklchHue(palette.base);
			const diff = hueDiff(baseH, accentHue);
			expect(Math.abs(diff - 30)).toBeLessThan(5);
		}
	});

	it('0 behaves the same as no baseHueShift', () => {
		const without = hextimate('#ff6600').format({
			as: 'object',
			colors: 'hex',
		});
		const withShift = hextimate('#ff6600', { baseHueShift: 0 }).format({
			as: 'object',
			colors: 'hex',
		});

		expect(withShift.light).toEqual(without.light);
		expect(withShift.dark).toEqual(without.dark);
	});

	it('explicit baseColor takes precedence over baseHueShift', () => {
		const result = hextimate('#ff6600', {
			baseColor: '#0000ff',
			baseHueShift: 90,
		}).format({ as: 'object', colors: 'oklch' });

		const blueHue = convert(parse('#0000ff'), 'oklch').h;
		for (const theme of THEME_TYPES) {
			const palette = result[theme] as Record<string, string>;
			const baseH = parseOklchHue(palette.base);
			const diff = Math.abs(hueDiff(baseH, blueHue));
			expect(diff).toBeLessThan(5);
		}
	});

	it('all shifts still meet AAA contrast', () => {
		const shifts = [30, 60, 90, 120, 150, 180, -30, -90, -180];

		for (const shift of shifts) {
			for (const color of TEST_COLORS) {
				for (const theme of THEME_TYPES) {
					const result = hextimate(color, { baseHueShift: shift }).format({
						as: 'object',
						colors: 'hex',
					});
					const palette = result[theme] as Record<string, string>;
					const roleScales = groupByRole(palette);

					for (const [role, scale] of Object.entries(roleScales)) {
						const fg = scale.foreground;
						if (!fg) continue;

						for (const [variant, value] of Object.entries(scale)) {
							if (variant === 'foreground') continue;
							const cr = contrast(value, fg);
							if (cr < MIN_CONTRAST) {
								throw new Error(
									`${role}.${variant} (${value}) vs foreground (${fg}) = ${cr.toFixed(2)} in ${theme} for ${color} with baseHueShift: ${shift}`,
								);
							}
						}
					}
				}
			}
		}
	});
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * Group flat "role-variant" keys into { role: { variant: value } }.
 * DEFAULT variant has no suffix (just the role name).
 */
function groupByRole(
	flat: Record<string, string>,
): Record<string, Record<string, string>> {
	const out: Record<string, Record<string, string>> = {};

	// First pass: identify role names (keys with no "-" that also have
	// companion keys like "key-strong")
	const keys = Object.keys(flat);

	for (const key of keys) {
		const dashIdx = key.indexOf('-');
		if (dashIdx === -1) {
			// Could be a DEFAULT for a role, or a standalone token
			out[key] ??= {};
			out[key].DEFAULT = flat[key];
		} else {
			const role = key.slice(0, dashIdx);
			const variant = key.slice(dashIdx + 1);
			out[role] ??= {};
			out[role][variant] = flat[key];
		}
	}

	return out;
}

/**
 * Parse the hue value from an oklch() string like "oklch(0.5 0.1 270)".
 */
function parseOklchHue(oklchStr: string): number {
	const match = oklchStr.match(/oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s*\)/);
	return match ? Number.parseFloat(match[1]) : 0;
}

/**
 * Signed shortest-arc hue difference (b - a), range [-180, 180].
 */
function hueDiff(a: number, b: number): number {
	return ((a - b + 540) % 360) - 180;
}

/**
 * Extract all keys belonging to a role from a flat token map.
 */
function extractRole(
	flat: Record<string, string>,
	role: string,
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(flat)) {
		if (key === role) {
			out.DEFAULT = value;
		} else if (key.startsWith(`${role}-`)) {
			out[key.slice(role.length + 1)] = value;
		}
	}
	return out;
}
