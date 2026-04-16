import { describe, expect, it } from 'bun:test';
import type { LinearRGB, RGB } from '../types';
import { linearToSrgb, srgbToLinear } from './srgb-linear';

const rgb = (r: number, g: number, b: number): RGB => ({
	space: 'srgb',
	r,
	g,
	b,
	alpha: 1,
});

const linear = (r: number, g: number, b: number): LinearRGB => ({
	space: 'linear-rgb',
	r,
	g,
	b,
	alpha: 1,
});

describe('srgbToLinear', () => {
	it('converts black', () => {
		const result = srgbToLinear(rgb(0, 0, 0));
		expect(result.r).toBeCloseTo(0, 10);
		expect(result.g).toBeCloseTo(0, 10);
		expect(result.b).toBeCloseTo(0, 10);
	});

	it('converts white', () => {
		const result = srgbToLinear(rgb(255, 255, 255));
		expect(result.r).toBeCloseTo(1, 5);
		expect(result.g).toBeCloseTo(1, 5);
		expect(result.b).toBeCloseTo(1, 5);
	});

	it('converts mid-gray (sRGB 128 ≈ linear 0.2158)', () => {
		const result = srgbToLinear(rgb(128, 128, 128));
		expect(result.r).toBeCloseTo(0.2158, 3);
	});

	it('preserves alpha', () => {
		const result = srgbToLinear({ ...rgb(255, 0, 0), alpha: 0.5 });
		expect(result.alpha).toBe(0.5);
	});
});

describe('linearToSrgb', () => {
	it('converts black', () => {
		const result = linearToSrgb(linear(0, 0, 0));
		expect(result.r).toBe(0);
		expect(result.g).toBe(0);
		expect(result.b).toBe(0);
	});

	it('converts white', () => {
		const result = linearToSrgb(linear(1, 1, 1));
		expect(result.r).toBe(255);
		expect(result.g).toBe(255);
		expect(result.b).toBe(255);
	});

	it('clamps out-of-range values', () => {
		const result = linearToSrgb(linear(1.5, -0.1, 0.5));
		expect(result.r).toBe(255);
		expect(result.g).toBe(0);
	});
});

describe('round-trip sRGB → Linear → sRGB', () => {
	it.each([
		[255, 0, 0],
		[0, 255, 0],
		[0, 0, 255],
		[128, 64, 192],
		[10, 10, 10],
		[245, 245, 245],
	])('round-trips (%d, %d, %d)', (r, g, b) => {
		const result = linearToSrgb(srgbToLinear(rgb(r, g, b)));
		expect(result.r).toBe(r);
		expect(result.g).toBe(g);
		expect(result.b).toBe(b);
	});
});
