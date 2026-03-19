import { describe, expect, it } from 'bun:test';
import type { RGB } from '../types';
import { linearRgbToOklab, oklabToLinearRgb } from './linear-oklab';
import { linearToSrgb, srgbToLinear } from './srgb-linear';

const rgb = (r: number, g: number, b: number): RGB => ({
	space: 'srgb',
	r,
	g,
	b,
	alpha: 1,
});

describe('linearRgbToOklab', () => {
	it('converts white to L≈1, a≈0, b≈0', () => {
		const result = linearRgbToOklab(srgbToLinear(rgb(255, 255, 255)));
		expect(result.l).toBeCloseTo(1, 3);
		expect(result.a).toBeCloseTo(0, 3);
		expect(result.b).toBeCloseTo(0, 3);
	});

	it('converts black to L≈0, a≈0, b≈0', () => {
		const result = linearRgbToOklab(srgbToLinear(rgb(0, 0, 0)));
		expect(result.l).toBeCloseTo(0, 3);
		expect(result.a).toBeCloseTo(0, 3);
		expect(result.b).toBeCloseTo(0, 3);
	});

	it('converts red (#FF0000) to known OKLab values', () => {
		// Reference: L≈0.6279, a≈0.2249, b≈0.1264
		const result = linearRgbToOklab(srgbToLinear(rgb(255, 0, 0)));
		expect(result.l).toBeCloseTo(0.6279, 3);
		expect(result.a).toBeCloseTo(0.2249, 3);
		expect(result.b).toBeCloseTo(0.1258, 3);
	});
});

describe('round-trip Linear → OKLab → Linear → sRGB', () => {
	it.each([
		[255, 0, 0],
		[0, 255, 0],
		[0, 0, 255],
		[128, 128, 128],
		[255, 255, 255],
		[0, 0, 0],
		[64, 128, 192],
	])('round-trips (%d, %d, %d) within ±1', (r, g, b) => {
		const linear = srgbToLinear(rgb(r, g, b));
		const oklab = linearRgbToOklab(linear);
		const backLinear = oklabToLinearRgb(oklab);
		const backSrgb = linearToSrgb(backLinear);
		expect(Math.abs(backSrgb.r - r)).toBeLessThanOrEqual(1);
		expect(Math.abs(backSrgb.g - g)).toBeLessThanOrEqual(1);
		expect(Math.abs(backSrgb.b - b)).toBeLessThanOrEqual(1);
	});
});
