import { describe, expect, it } from 'bun:test';
import { convert } from '../convert';
import { format } from '../format';
import { hextimate } from '../hextimate';
import { parse } from '../parse';
import type { ColorFormat } from '../types';
import { generate } from './generate';
import { FOREGROUND_ROLES } from './surfaceForegrounds';
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
const SURFACES = ['surface', 'surface-weak', 'surface-strong'];

const cssColor = (value: string) => {
	const color = parse(value);
	// HSL parsing normalizes percentages, while conversion expects 0-100.
	return color.space === 'hsl'
		? { ...color, s: color.s * 100, l: color.l * 100 }
		: color;
};
const minSurfaceContrast = (palette: Record<string, string>, token: string) =>
	Math.min(
		...SURFACES.map((surface) =>
			calculateContrast(cssColor(palette[token]), cssColor(palette[surface])),
		),
	);

describe('surface foregrounds for roles', () => {
	for (const seed of seeds) {
		for (const target of [4.5, 7]) {
			for (const colors of formats) {
				it(`${seed}, ${target}:1, ${colors}: meet the target on every surface`, () => {
					const result = hextimate(seed)
						.style({ minContrastRatio: target })
						.format({ as: 'object', colors });
					for (const palette of [result.light, result.dark])
						for (const role of FOREGROUND_ROLES)
							expect(
								minSurfaceContrast(palette, `surface-foreground-${role}`),
							).toBeGreaterThanOrEqual(target);
				});
			}
		}
	}

	it('keeps the role hue and chroma', () => {
		const result = hextimate('#ff6600').format({
			as: 'object',
			colors: 'oklch',
		});
		for (const palette of [result.light, result.dark]) {
			const fill = convert(parse(palette.negative), 'oklch');
			const text = convert(
				parse(palette['surface-foreground-negative']),
				'oklch',
			);
			expect(Math.abs(((text.h - fill.h + 540) % 360) - 180)).toBeLessThan(1);
			expect(text.c).toBeGreaterThan(0.03);
		}
	});

	it('leaves every existing token unchanged', () => {
		const result = hextimate('#ff6600').format({ as: 'object' });
		for (const theme of ['light', 'dark'] as const) {
			const existing = format(generate(parse('#ff6600'), theme), {
				as: 'object',
			}) as Record<string, string>;
			for (const [name, value] of Object.entries(existing))
				expect(result[theme][name]).toBe(value);
		}
	});

	it('recomputes against final surface overrides', () => {
		const builder = hextimate('#ff6600');
		const before = builder.format({ as: 'object' });
		const result = builder
			.addToken('surface.weak', { light: '#cccccc', dark: '#444444' })
			.format({ as: 'object' });
		for (const theme of ['light', 'dark'] as const) {
			expect(result[theme]['surface-foreground-negative']).not.toBe(
				before[theme]['surface-foreground-negative'],
			);
			expect(
				minSurfaceContrast(result[theme], 'surface-foreground-negative'),
			).toBeGreaterThanOrEqual(7);
		}
	});

	it('keeps direct overrides through fork and style changes', () => {
		const result = hextimate('#ff6600')
			.addToken('surface.foreground-negative', '#123456')
			.fork()
			.style({ minContrastRatio: 'AA' })
			.format({ as: 'object' });
		expect(result.light['surface-foreground-negative']).toBe('#123456');
		expect(result.dark['surface-foreground-negative']).toBe('#123456');
	});

	it('lets standalone tokens reference them', () => {
		const result = hextimate('#ff6600')
			.addToken('error-label', { from: 'surface.foreground-negative' })
			.format({ as: 'object' });
		expect(result.light['error-label']).toBe(
			result.light['surface-foreground-negative'],
		);
	});

	it('uses the strongest available contrast when the target is unreachable', () => {
		const result = hextimate('#ff6600')
			.style({ minContrastRatio: 21 })
			.format({ as: 'object' });
		for (const palette of [result.light, result.dark])
			expect(
				minSurfaceContrast(palette, 'surface-foreground-negative'),
			).toBeGreaterThan(10);
	});

	it('emits Tailwind colors under the surface-foreground name', () => {
		const css = hextimate('#ff6600').format({
			as: 'tailwind-css',
			roleNames: { surface: 'base' },
		});
		expect(css).toContain('--color-base-foreground-negative:');
	});
});
