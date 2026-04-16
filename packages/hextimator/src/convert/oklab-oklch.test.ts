import { describe, expect, it } from 'bun:test';
import type { OKLab } from '../types';
import { oklabToOklch, oklchToOklab } from './oklab-oklch';

const oklab = (l: number, a: number, b: number): OKLab => ({
	space: 'oklab',
	l,
	a,
	b,
	alpha: 1,
});

describe('oklabToOklch', () => {
	it('converts a=0, b=0 (achromatic) to c≈0', () => {
		const result = oklabToOklch(oklab(0.5, 0, 0));
		expect(result.c).toBeCloseTo(0, 10);
	});

	it('computes chroma correctly', () => {
		const result = oklabToOklch(oklab(0.5, 0.3, 0.4));
		expect(result.c).toBeCloseTo(0.5, 4); // sqrt(0.09 + 0.16) = 0.5
	});

	it('computes hue in degrees', () => {
		// a=1, b=0 → h=0°
		const r1 = oklabToOklch(oklab(0.5, 1, 0));
		expect(r1.h).toBeCloseTo(0, 3);

		// a=0, b=1 → h=90°
		const r2 = oklabToOklch(oklab(0.5, 0, 1));
		expect(r2.h).toBeCloseTo(90, 3);

		// a=-1, b=0 → h=180°
		const r3 = oklabToOklch(oklab(0.5, -1, 0));
		expect(r3.h).toBeCloseTo(180, 3);
	});

	it('wraps negative atan2 to positive degrees', () => {
		// a=0, b=-1 → h=270°
		const result = oklabToOklch(oklab(0.5, 0, -1));
		expect(result.h).toBeCloseTo(270, 3);
	});
});

describe('round-trip OKLab → OKLCH → OKLab', () => {
	it.each([
		[0.5, 0.2, 0.1],
		[0.8, -0.1, 0.15],
		[0.3, 0.0, 0.0],
		[1.0, 0.0, 0.0],
		[0.0, 0.0, 0.0],
	])('round-trips (L=%f, a=%f, b=%f)', (l, a, b) => {
		const oklch = oklabToOklch(oklab(l, a, b));
		const back = oklchToOklab(oklch);
		expect(back.l).toBeCloseTo(l, 10);
		expect(back.a).toBeCloseTo(a, 10);
		expect(back.b).toBeCloseTo(b, 10);
	});
});
