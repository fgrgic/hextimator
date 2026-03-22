import { convert } from '../../convert';
import type { HextimatePalette } from '../../generate/types';
import { parse } from '../../parse';
import type { Color, OKLCH } from '../../types';
import { type CVDType, resolveBaseType, simulateCVD } from './matrices';

/**
 * Error redistribution matrices per deficiency type.
 * These shift the simulation error into channels the person can perceive.
 *
 * For protan/deutan deficiencies, the red-green error is pushed into blue.
 * For tritan deficiency, the blue-yellow error is pushed into red/green.
 */
const ERROR_REDISTRIBUTION: Record<
	string,
	readonly (readonly [number, number, number])[]
> = {
	protanopia: [
		[0, 0, 0],
		[0.7, 1, 0],
		[0.7, 0, 1],
	],
	deuteranopia: [
		[1, 0, 0],
		[0.7, 0, 0],
		[0, 0.7, 1],
	],
	tritanopia: [
		[1, 0, 0.7],
		[0, 1, 0.7],
		[0, 0, 0],
	],
};

/**
 * Daltonize a single color: shift it so it's more distinguishable
 * for someone with a given CVD type.
 *
 * 1. Simulate the deficiency to find what they'd see
 * 2. Compute the perceptual error (original − simulated)
 * 3. Redistribute the error into channels they can perceive
 * 4. Add correction back to original
 */
export function daltonize(
	rgb: readonly [number, number, number],
	type: CVDType,
	severity: number,
): [number, number, number] {
	const s = Math.max(0, Math.min(1, severity));
	if (s === 0) return [rgb[0], rgb[1], rgb[2]];

	if (type === 'achromatopsia') {
		// Can't meaningfully daltonize for total color blindness;
		// boost luminance contrast instead by stretching toward 0 or 1
		const y = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
		const target = y > 0.5 ? 1 : 0;
		return [
			rgb[0] + s * 0.3 * (target - rgb[0]),
			rgb[1] + s * 0.3 * (target - rgb[1]),
			rgb[2] + s * 0.3 * (target - rgb[2]),
		];
	}

	const baseType = resolveBaseType(type);
	const simulated = simulateCVD(rgb, type, 1);

	// Error: what they lose
	const err: [number, number, number] = [
		rgb[0] - simulated[0],
		rgb[1] - simulated[1],
		rgb[2] - simulated[2],
	];

	// Redistribute error into visible channels
	const redist = ERROR_REDISTRIBUTION[baseType];
	const correction: [number, number, number] = [
		redist[0][0] * err[0] + redist[0][1] * err[1] + redist[0][2] * err[2],
		redist[1][0] * err[0] + redist[1][1] * err[1] + redist[1][2] * err[2],
		redist[2][0] * err[0] + redist[2][1] * err[1] + redist[2][2] * err[2],
	];

	return [
		Math.max(0, Math.min(1, rgb[0] + s * correction[0])),
		Math.max(0, Math.min(1, rgb[1] + s * correction[1])),
		Math.max(0, Math.min(1, rgb[2] + s * correction[2])),
	];
}

/**
 * Daltonize a color and return the result in OKLCH.
 */
export function daltonizeColor(
	color: Color,
	type: CVDType,
	severity = 1,
): OKLCH {
	const linear = convert(color, 'linear-rgb');
	const corrected = daltonize([linear.r, linear.g, linear.b], type, severity);

	return convert(
		{
			space: 'linear-rgb' as const,
			r: corrected[0],
			g: corrected[1],
			b: corrected[2],
			alpha: linear.alpha,
		},
		'oklch',
	);
}

/**
 * Adapt an entire palette for a specific color vision deficiency.
 * Each color is daltonized and stored back as OKLCH.
 */
export function adaptPalette(
	palette: HextimatePalette,
	type: CVDType,
	severity = 1,
): HextimatePalette {
	const result: HextimatePalette = {};

	for (const role of Object.keys(palette)) {
		const scale = palette[role];
		const newScale: HextimatePalette[string] = {
			DEFAULT: scale.DEFAULT,
			strong: scale.strong,
			weak: scale.weak,
			foreground: scale.foreground,
		};

		for (const variant of Object.keys(scale)) {
			newScale[variant] = daltonizeColor(parse(scale[variant]), type, severity);
		}

		result[role] = newScale;
	}

	return result;
}
