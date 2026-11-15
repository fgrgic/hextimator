import { describe, expect, it } from 'bun:test';
import { convert } from '../convert';
import { hextimate } from '../hextimate';
import { parse } from '../parse';
import type { ColorFormat } from '../types';
import { INK_ROLES, INK_VARIANTS } from './propertyColors';
import { calculateContrast } from './utils';

const seeds = [
	'#0000ff',
	'#ffff00',
	'#ff0000',
	'#00ff00',
	'#ff6600',
	'#800080',
	'#00cccc',
	'#111111',
	'#eeeeee',
	'oklch(0.7 0.4 30)',
	'#ff660033',
];
const formats: ColorFormat[] = ['hex', 'rgb', 'hsl', 'oklch', 'p3'];
const cssColor = (value: string) => {
	const color = parse(value);
	// HSL parsing normalizes percentages, while conversion expects 0-100.
	return color.space === 'hsl'
		? { ...color, s: color.s * 100, l: color.l * 100 }
		: color;
};
const contrast = (a: string, b: string) =>
	calculateContrast(cssColor(a), cssColor(b));

describe('property-aware colors', () => {
	for (const seed of seeds) {
		for (const target of [4.5, 7]) {
			for (const colors of formats) {
				it(`${seed}, ${target}:1, ${colors}: all inks support all surfaces`, () => {
					const result = hextimate(seed)
						.style({ minContrastRatio: target })
						.format({ as: 'object', colors });
					for (const palette of [result.light, result.dark]) {
						for (const role of INK_ROLES) {
							for (const surface of [
								'surface',
								'surface-weak',
								'surface-strong',
							]) {
								for (const variant of INK_VARIANTS) {
									const minimum = variant.startsWith('placeholder')
										? 4.5
										: target;
									expect(
										contrast(palette[`${role}-${variant}`], palette[surface]),
									).toBeGreaterThanOrEqual(minimum);
								}
								expect(
									contrast(palette[`${role}-ink`], palette[surface]),
								).toBeGreaterThanOrEqual(
									contrast(palette[`${role}-ink-weak`], palette[surface]),
								);
								expect(
									contrast(palette[`${role}-ink-strong`], palette[surface]),
								).toBeGreaterThanOrEqual(
									contrast(palette[`${role}-ink`], palette[surface]),
								);
							}
						}
					}
				});
			}
		}
	}

	it('preserves semantic hue and chroma when solving red ink', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			colors: 'oklch',
		});
		for (const palette of [result.light, result.dark]) {
			const fill = convert(parse(palette.negative), 'oklch');
			for (const variant of INK_VARIANTS) {
				const ink = convert(parse(palette[`negative-${variant}`]), 'oklch');
				const distance = Math.abs(((ink.h - fill.h + 540) % 360) - 180);
				expect(distance).toBeLessThan(1);
				expect(ink.c).toBeGreaterThan(0.03);
			}
		}
	});

	it('leaves every existing fill, foreground, and surface token unchanged', () => {
		const builder = hextimate('#ff6600');
		const current = builder.format({ as: 'object' });
		const legacy = builder
			.fork()
			.style({ propertyAware: false })
			.format({ as: 'object' });
		for (const theme of ['light', 'dark'] as const) {
			for (const [name, value] of Object.entries(legacy[theme]))
				expect(current[theme][name]).toBe(value);
			expect(legacy[theme]['negative-ink']).toBeUndefined();
		}
	});

	it('enforces an explicit AAA placeholder target in both themes', () => {
		const result = hextimate('#ffff00')
			.style({ minContrastRatio: 'AA', placeholderContrastRatio: 'AAA' })
			.format({ as: 'object' });
		for (const palette of [result.light, result.dark]) {
			for (const role of INK_ROLES) {
				for (const suffix of ['', '-weak', '-strong']) {
					for (const surface of ['surface', 'surface-weak', 'surface-strong']) {
						expect(
							contrast(
								palette[`${role}-placeholder${suffix}`],
								palette[surface],
							),
						).toBeGreaterThanOrEqual(7);
					}
				}
			}
		}
	});

	it('supports per-theme placeholder targets', () => {
		const result = hextimate('#ff6600')
			.style({
				light: { placeholderContrastRatio: 7 },
				dark: { placeholderContrastRatio: 4.5 },
			})
			.format({ as: 'object' });
		expect(
			contrast(
				result.light['negative-placeholder-weak'],
				result.light['surface-weak'],
			),
		).toBeGreaterThanOrEqual(7);
		expect(
			contrast(
				result.dark['negative-placeholder-weak'],
				result.dark['surface-weak'],
			),
		).toBeLessThan(7);
	});

	it('recomputes inks against final surface overrides', () => {
		const builder = hextimate('#ff6600');
		const before = builder.format({ as: 'object' });
		const result = builder
			.addToken('surface.weak', { light: '#cccccc', dark: '#444444' })
			.format({ as: 'object' });
		for (const theme of ['light', 'dark'] as const) {
			expect(result[theme]['negative-ink-weak']).not.toBe(
				before[theme]['negative-ink-weak'],
			);
			for (const surface of ['surface', 'surface-weak', 'surface-strong'])
				expect(
					contrast(result[theme]['negative-ink-weak'], result[theme][surface]),
				).toBeGreaterThanOrEqual(7);
		}
	});

	it('keeps direct ink overrides through formatting, fork, and style changes', () => {
		const builder = hextimate('#ff6600').addToken('negative.ink', '#123456');
		expect(builder.format({ as: 'object' }).light['negative-ink']).toBe(
			'#123456',
		);
		expect(builder.format({ as: 'object' }).light['negative-ink']).toBe(
			'#123456',
		);
		expect(
			builder.fork().style({ minContrastRatio: 'AA' }).format({ as: 'object' })
				.dark['negative-ink'],
		).toBe('#123456');
	});

	it('allows standalone tokens to reference generated inks', () => {
		const result = hextimate('#ff6600')
			.addToken('error-label', { from: 'negative.ink' })
			.format({ as: 'object' });
		expect(result.light['error-label']).toBe(result.light['negative-ink']);
	});

	it('rejects impossible contrast settings rather than claiming success', () => {
		expect(() =>
			hextimate('#ff6600').style({ placeholderContrastRatio: 21 }).format(),
		).toThrow('cannot support');
	});

	it('preserves explicit surface overrides even when no ink can support all surfaces', () => {
		const result = hextimate('#ff6600')
			.addToken('surface.weak', '#123456')
			.format({ as: 'object' });
		expect(result.light['surface-weak']).toBe('#123456');
	});

	it('emits property-aware Tailwind utilities with scoped variables and remapped names', () => {
		const css = hextimate('#ff6600').format({
			as: 'tailwind-css',
			roleNames: { negative: 'danger' },
			darkMode: 'class',
		});
		expect(css).toContain(
			'@utility text-danger {\n  color: var(--danger-ink);',
		);
		expect(css).toContain(
			'@utility bg-danger {\n  background-color: var(--danger);',
		);
		expect(css).toContain(
			'@utility border-danger {\n  border-color: var(--danger);',
		);
		expect(css).toContain('@utility fill-danger {\n  fill: var(--danger-ink);');
		expect(css).toContain('opacity: 1;');
		expect(css).not.toContain('--color-danger:');
		expect(css).toContain('.dark {');
	});

	it('retains the old Tailwind namespace when disabled', () => {
		const css = hextimate('#ff6600')
			.style({ propertyAware: false })
			.format({ as: 'tailwind-css' });
		expect(css).toContain('--color-negative:');
		expect(css).not.toContain('@utility');
	});
});
