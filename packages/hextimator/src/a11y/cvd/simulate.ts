import { convert } from '../../convert';
import type { HextimatePalette } from '../../generate/types';
import { parse } from '../../parse';
import type { Color, OKLCH } from '../../types';
import { type CVDType, simulateCVD } from './matrices';

/**
 * Simulate how a color appears under a given color vision deficiency.
 * Converts to linear RGB for the matrix multiply, then back to OKLCH.
 */
export function simulateColor(
	color: Color,
	type: CVDType,
	severity = 1,
): OKLCH {
	const linear = convert(color, 'linear-rgb');
	const simulated = simulateCVD([linear.r, linear.g, linear.b], type, severity);

	const simulatedLinear = {
		space: 'linear-rgb' as const,
		r: Math.max(0, simulated[0]),
		g: Math.max(0, simulated[1]),
		b: Math.max(0, simulated[2]),
		alpha: linear.alpha,
	};

	return convert(simulatedLinear, 'oklch');
}

/**
 * Simulate color vision deficiency on an entire palette.
 * Each color in each scale is transformed and stored back as OKLCH.
 */
export function simulatePalette(
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
			newScale[variant] = simulateColor(parse(scale[variant]), type, severity);
		}

		result[role] = newScale;
	}

	return result;
}
