import type { OKLCH } from '../types';
import { M1_INV, M2_INV, multiplyMatrix3 } from './matrices';
import { LINEAR_SRGB_TO_P3 } from './p3-matrices';

const DEG_TO_RAD = Math.PI / 180;
const EPSILON = 1e-4;
const MAX_ITERATIONS = 16;

/**
 * Fast check: does the given OKLCH color fit inside sRGB [0, 1]?
 * Works directly in linear-RGB so we skip full Color object creation.
 */
function oklchToLinearRgbRaw(
	l: number,
	c: number,
	h: number,
): [number, number, number] {
	const hRad = h * DEG_TO_RAD;
	const a = c * Math.cos(hRad);
	const b = c * Math.sin(hRad);

	const lms_ = multiplyMatrix3(M2_INV, [l, a, b]);
	const lms = lms_.map((v) => v * v * v) as [number, number, number];
	return multiplyMatrix3(M1_INV, lms);
}

function isInGamut(r: number, g: number, b: number): boolean {
	return (
		r >= -EPSILON &&
		r <= 1 + EPSILON &&
		g >= -EPSILON &&
		g <= 1 + EPSILON &&
		b >= -EPSILON &&
		b <= 1 + EPSILON
	);
}

/**
 * Map an OKLCH color into the sRGB gamut by reducing chroma
 * while preserving lightness and hue.
 *
 * Uses binary search on chroma, converging in ≤16 iterations.
 * Returns a new OKLCH color with chroma ≤ the original.
 */
export function gamutMapOklch(color: OKLCH): OKLCH {
	// Achromatic or already in gamut → fast path
	if (color.c <= EPSILON) {
		return { ...color, c: 0 };
	}

	const [r, g, b] = oklchToLinearRgbRaw(color.l, color.c, color.h);
	if (isInGamut(r, g, b)) {
		return color;
	}

	let lo = 0;
	let hi = color.c;

	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const mid = (lo + hi) / 2;
		const [rm, gm, bm] = oklchToLinearRgbRaw(color.l, mid, color.h);

		if (isInGamut(rm, gm, bm)) {
			lo = mid;
		} else {
			hi = mid;
		}
	}

	return { ...color, c: lo };
}

/**
 * Map an OKLCH color into the Display P3 gamut by reducing chroma
 * while preserving lightness and hue.
 *
 * P3 has a wider gamut than sRGB, so less chroma reduction is needed.
 */
export function gamutMapOklchToP3(color: OKLCH): OKLCH {
	if (color.c <= EPSILON) {
		return { ...color, c: 0 };
	}

	// Convert OKLCH → linear sRGB → linear P3 and check P3 gamut
	const [rSrgb, gSrgb, bSrgb] = oklchToLinearRgbRaw(color.l, color.c, color.h);
	const [rP3, gP3, bP3] = multiplyMatrix3(LINEAR_SRGB_TO_P3, [
		rSrgb,
		gSrgb,
		bSrgb,
	]);

	if (isInGamut(rP3, gP3, bP3)) {
		return color;
	}

	let lo = 0;
	let hi = color.c;

	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const mid = (lo + hi) / 2;
		const [rm, gm, bm] = oklchToLinearRgbRaw(color.l, mid, color.h);
		const [rP3m, gP3m, bP3m] = multiplyMatrix3(LINEAR_SRGB_TO_P3, [rm, gm, bm]);

		if (isInGamut(rP3m, gP3m, bP3m)) {
			lo = mid;
		} else {
			hi = mid;
		}
	}

	return { ...color, c: lo };
}
