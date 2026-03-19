/**
 * Ottosson's matrices for OKLab conversion and their inverses.
 */

// Linear sRGB → LMS (combines sRGB→XYZ with XYZ→LMS, optimized by Ottosson)
export const M1 = [
	[0.4122214708, 0.5363325363, 0.0514459929],
	[0.2119034982, 0.6806995451, 0.1073969566],
	[0.0883024619, 0.2817188376, 0.6299787005],
] as const;

// LMS' → OKLab (numerically optimized by Ottosson)
export const M2 = [
	[0.2104542553, 0.793617785, -0.0040720468],
	[1.9779984951, -2.428592205, 0.4505937099],
	[0.0259040371, 0.7827717662, -0.808675766],
] as const;

// LMS → Linear sRGB
export const M1_INV = [
	[4.0767416621, -3.3077115913, 0.2309699292],
	[-1.2684380046, 2.6097574011, -0.3413193965],
	[-0.0041960863, -0.7034186147, 1.707614701],
] as const;

// OKLab → LMS'
export const M2_INV = [
	[1.0, 0.3963377774, 0.2158037573],
	[1.0, -0.1055613458, -0.0638541728],
	[1.0, -0.0894841775, -1.291485548],
] as const;

/** Multiply a 3×3 matrix by a 3-element vector. */
export function multiplyMatrix3(
	m: readonly (readonly [number, number, number])[],
	v: readonly [number, number, number],
): [number, number, number] {
	return [
		m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
		m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
		m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
	];
}
