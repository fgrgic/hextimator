import { describe, expect, it } from 'bun:test';
import type { HSL, RGB } from '../types';
import { hslToSrgb, srgbToHsl } from './srgb-hsl';

const rgb = (r: number, g: number, b: number): RGB => ({
	space: 'srgb',
	r,
	g,
	b,
	alpha: 1,
});

const _hsl = (h: number, s: number, l: number): HSL => ({
	space: 'hsl',
	h,
	s,
	l,
	alpha: 1,
});

describe('srgbToHsl', () => {
	it('converts red', () => {
		const result = srgbToHsl(rgb(255, 0, 0));
		expect(result.h).toBeCloseTo(0, 3);
		expect(result.s).toBeCloseTo(100, 3);
		expect(result.l).toBeCloseTo(50, 3);
	});

	it('converts green', () => {
		const result = srgbToHsl(rgb(0, 255, 0));
		expect(result.h).toBeCloseTo(120, 3);
		expect(result.s).toBeCloseTo(100, 3);
		expect(result.l).toBeCloseTo(50, 3);
	});

	it('converts white (achromatic)', () => {
		const result = srgbToHsl(rgb(255, 255, 255));
		expect(result.s).toBeCloseTo(0, 3);
		expect(result.l).toBeCloseTo(100, 3);
	});

	it('converts black (achromatic)', () => {
		const result = srgbToHsl(rgb(0, 0, 0));
		expect(result.s).toBeCloseTo(0, 3);
		expect(result.l).toBeCloseTo(0, 3);
	});

	it('converts mid-gray', () => {
		const result = srgbToHsl(rgb(128, 128, 128));
		expect(result.s).toBeCloseTo(0, 3);
		expect(result.l).toBeCloseTo(50.2, 0);
	});
});

describe('round-trip sRGB → HSL → sRGB', () => {
	it.each([
		[255, 0, 0],
		[0, 255, 0],
		[0, 0, 255],
		[128, 64, 192],
		[255, 255, 255],
		[0, 0, 0],
		[10, 200, 100],
	])('round-trips (%d, %d, %d)', (r, g, b) => {
		const result = hslToSrgb(srgbToHsl(rgb(r, g, b)));
		expect(Math.abs(result.r - r)).toBeLessThanOrEqual(1);
		expect(Math.abs(result.g - g)).toBeLessThanOrEqual(1);
		expect(Math.abs(result.b - b)).toBeLessThanOrEqual(1);
	});
});
