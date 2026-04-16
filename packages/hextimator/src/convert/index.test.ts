import { describe, expect, it } from 'bun:test';
import type {
	Color,
	ColorSpace,
	DisplayP3,
	HSL,
	LinearRGB,
	OKLab,
	OKLCH,
	RGB,
} from '../types';
import { convert } from './index';

const red: RGB = { space: 'srgb', r: 255, g: 0, b: 0, alpha: 1 };
const white: RGB = { space: 'srgb', r: 255, g: 255, b: 255, alpha: 1 };
const black: RGB = { space: 'srgb', r: 0, g: 0, b: 0, alpha: 1 };

describe('convert() dispatcher', () => {
	it('returns a copy for identity conversions', () => {
		const result = convert(red, 'srgb');
		expect(result).toEqual(red);
		expect(result).not.toBe(red); // different object
	});

	it('srgb → oklch → srgb round-trip within ±1', () => {
		const oklch = convert(red, 'oklch');
		expect(oklch.space).toBe('oklch');
		const back = convert(oklch, 'srgb');
		expect(Math.abs(back.r - 255)).toBeLessThanOrEqual(1);
		expect(Math.abs(back.g - 0)).toBeLessThanOrEqual(1);
		expect(Math.abs(back.b - 0)).toBeLessThanOrEqual(1);
	});

	it('srgb → hsl → srgb round-trip', () => {
		const hsl = convert(red, 'hsl');
		expect(hsl.space).toBe('hsl');
		expect(hsl.h).toBeCloseTo(0, 3);
		expect(hsl.s).toBeCloseTo(100, 3);
		const back = convert(hsl, 'srgb');
		expect(back.r).toBe(255);
		expect(back.g).toBe(0);
		expect(back.b).toBe(0);
	});

	it('hsl → oklch → hsl round-trip', () => {
		const hsl: HSL = { space: 'hsl', h: 200, s: 80, l: 50, alpha: 1 };
		const oklch = convert(hsl, 'oklch');
		expect(oklch.space).toBe('oklch');
		const back = convert(oklch, 'hsl');
		expect(Math.abs(back.h - hsl.h)).toBeLessThan(1);
		expect(Math.abs(back.s - hsl.s)).toBeLessThan(2);
		expect(Math.abs(back.l - hsl.l)).toBeLessThan(1);
	});

	it('preserves alpha through conversions', () => {
		const c: RGB = { ...red, alpha: 0.42 };
		const oklch = convert(c, 'oklch');
		expect(oklch.alpha).toBe(0.42);
		const back = convert(oklch, 'srgb');
		expect(back.alpha).toBe(0.42);
	});

	it('converts white to OKLCH with L≈1, C≈0', () => {
		const result = convert(white, 'oklch');
		expect(result.l).toBeCloseTo(1, 3);
		expect(result.c).toBeCloseTo(0, 3);
	});

	it('converts black to OKLCH with L≈0, C≈0', () => {
		const result = convert(black, 'oklch');
		expect(result.l).toBeCloseTo(0, 3);
		expect(result.c).toBeCloseTo(0, 3);
	});

	it('throws for unsupported conversion', () => {
		expect(() => convert(red, 'xyz' as unknown as ColorSpace)).toThrow(
			'Unsupported conversion',
		);
	});

	it('srgb → display-p3 → srgb round-trip within ±1', () => {
		const p3 = convert(red, 'display-p3');
		expect(p3.space).toBe('display-p3');
		// sRGB red in P3 should have r < 1 (P3 has wider gamut)
		expect(p3.r).toBeLessThan(1);
		const back = convert(p3, 'srgb');
		expect(Math.abs(back.r - 255)).toBeLessThanOrEqual(1);
		expect(Math.abs(back.g - 0)).toBeLessThanOrEqual(1);
		expect(Math.abs(back.b - 0)).toBeLessThanOrEqual(1);
	});

	it('oklch → display-p3 preserves wider gamut than srgb', () => {
		// A vivid OKLCH color that's out of sRGB but in P3
		const vividOklch: OKLCH = {
			space: 'oklch',
			l: 0.65,
			c: 0.29,
			h: 150,
			alpha: 1,
		};
		const p3 = convert(vividOklch, 'display-p3');
		const srgb = convert(vividOklch, 'srgb');

		// The sRGB version gets gamut-mapped (clamped), but P3 might preserve more chroma
		const p3Oklch = convert(p3, 'oklch');
		const srgbOklch = convert(srgb, 'oklch');

		// P3 should preserve at least as much chroma as sRGB
		expect(p3Oklch.c).toBeGreaterThanOrEqual(srgbOklch.c - 0.001);
	});
});

describe('convert() covers all directed pairs', () => {
	const spaces: ColorSpace[] = [
		'srgb',
		'linear-rgb',
		'oklab',
		'oklch',
		'hsl',
		'display-p3',
	];

	const samples: Record<string, Color> = {
		srgb: red,
		'linear-rgb': {
			space: 'linear-rgb',
			r: 1,
			g: 0,
			b: 0,
			alpha: 1,
		} as LinearRGB,
		oklab: {
			space: 'oklab',
			l: 0.6279,
			a: 0.2249,
			b: 0.1264,
			alpha: 1,
		} as OKLab,
		oklch: {
			space: 'oklch',
			l: 0.6279,
			c: 0.258,
			h: 29.23,
			alpha: 1,
		} as OKLCH,
		hsl: { space: 'hsl', h: 0, s: 100, l: 50, alpha: 1 } as HSL,
		'display-p3': {
			space: 'display-p3',
			r: 0.9,
			g: 0.3,
			b: 0.3,
			alpha: 1,
		} as DisplayP3,
	};

	for (const from of spaces) {
		for (const to of spaces) {
			if (from === to) continue;
			it(`${from} → ${to}`, () => {
				const result = convert(samples[from], to);
				expect(result.space).toBe(to);
			});
		}
	}
});
