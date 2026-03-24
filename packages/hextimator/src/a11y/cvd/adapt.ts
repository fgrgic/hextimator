import { convert } from '../../convert';
import type { HextimatePalette } from '../../generate/types';
import { parse } from '../../parse';
import type { Color, OKLCH } from '../../types';
import { type CVDType, simulateCVD } from './matrices';

// Redistribute simulation error into channels the person can still perceive
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

export function daltonize(
	rgb: readonly [number, number, number],
	type: CVDType,
	severity: number,
): [number, number, number] {
	const s = Math.max(0, Math.min(1, severity));
	if (s === 0) return [rgb[0], rgb[1], rgb[2]];

	if (type === 'achromatopsia') {
		// No color channels to redistribute into; boost luminance contrast instead
		const y = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
		const target = y > 0.5 ? 1 : 0;
		return [
			rgb[0] + s * 0.3 * (target - rgb[0]),
			rgb[1] + s * 0.3 * (target - rgb[1]),
			rgb[2] + s * 0.3 * (target - rgb[2]),
		];
	}

	const simulated = simulateCVD(rgb, type, 1);

	const err: [number, number, number] = [
		rgb[0] - simulated[0],
		rgb[1] - simulated[1],
		rgb[2] - simulated[2],
	];

	const redist = ERROR_REDISTRIBUTION[type];
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
 * Daltonize a color for a specific type of color vision deficiency (CVD).
 *
 * Daltonization attempts to preserve the appearance of the color by redistributing the error from the CVD simulation into the channels that the person can still perceive.
 *
 * Note that daltonization is not a perfect solution and may not work well for all colors or all types of CVD.
 * It is intended as a tool for improving accessibility,
 * but should be used with caution and tested with real users whenever possible.
 *
 *
 * @param color The color to daltonize.
 * @param type The type of color vision deficiency to daltonize for (e.g. "protanopia", "deuteranopia", "tritanopia", "achromatopsia").
 * @param severity The severity of the color vision deficiency to daltonize for, on a scale from 0 (no deficiency) to 1 (complete deficiency). Default is 1.
 * @returns The daltonized color in OKLCH color space.
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
 *
 * Daltonize a palette for a specific type of color vision deficiency (CVD).
 *
 * This applies the daltonization process to each color in the palette, attempting to preserve the appearance
 * of the colors for someone with the specified type and severity of CVD.
 *
 * Note that daltonization is not a perfect solution and may not work well for all colors or all types of CVD.
 * It is intended as a tool for improving accessibility, but should be used with caution and tested with real users whenever possible.
 *
 * @param palette The palette to daltonize, in the same format as the output of `hextimate()`.
 * @param type The type of color vision deficiency to daltonize for (e.g. "protanopia", "deuteranopia", "tritanopia", "achromatopsia").
 * @param severity The severity of the color vision deficiency to daltonize for, on a scale from 0 (no deficiency) to 1 (complete deficiency). Default is 1.
 * @returns The daltonized palette, in the same format as the input, but with each color daltonized for the specified type and severity of CVD.
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
			foreground: scale.foreground,
		};

		for (const variant of Object.keys(scale)) {
			newScale[variant] = daltonizeColor(parse(scale[variant]), type, severity);
		}

		result[role] = newScale;
	}

	return result;
}
