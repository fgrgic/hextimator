import type { OKLCH } from '../types';
import { M1_INV, M2_INV, multiplyMatrix3 } from './matrices';

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
	return r >= -EPSILON && r <= 1 + EPSILON && g >= -EPSILON && g <= 1 + EPSILON && b >= -EPSILON && b <= 1 + EPSILON;
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
