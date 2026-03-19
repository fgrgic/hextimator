import type { Color, ColorInSpace, ColorSpace } from '../types';
import { linearRgbToOklab, oklabToLinearRgb } from './linear-oklab';
import { oklabToOklch, oklchToOklab } from './oklab-oklch';
import { hslToSrgb, srgbToHsl } from './srgb-hsl';
import { linearToSrgb, srgbToLinear } from './srgb-linear';

type ConvertFn = (color: Color) => Color;

/** Chain multiple conversion functions into one. */
function chain(...fns: ConvertFn[]): ConvertFn {
	return (color: Color) => fns.reduce((c, fn) => fn(c), color);
}

/**
 * Lookup table for all directed pairs among: srgb, linear-rgb, oklab, oklch, hsl.
 * Each entry is a function that converts from the key's source to its target.
 */
const conversions: Record<string, ConvertFn> = {
	// srgb ↔ linear-rgb
	'srgb->linear-rgb': srgbToLinear,
	'linear-rgb->srgb': linearToSrgb,

	// linear-rgb ↔ oklab
	'linear-rgb->oklab': linearRgbToOklab,
	'oklab->linear-rgb': oklabToLinearRgb,

	// oklab ↔ oklch
	'oklab->oklch': oklabToOklch,
	'oklch->oklab': oklchToOklab,

	// srgb ↔ hsl
	'srgb->hsl': srgbToHsl,
	'hsl->srgb': hslToSrgb,

	// srgb → oklab / oklch
	'srgb->oklab': chain(srgbToLinear, linearRgbToOklab),
	'srgb->oklch': chain(srgbToLinear, linearRgbToOklab, oklabToOklch),

	// oklab / oklch → srgb
	'oklab->srgb': chain(oklabToLinearRgb, linearToSrgb),
	'oklch->srgb': chain(oklchToOklab, oklabToLinearRgb, linearToSrgb),

	// linear-rgb → oklch
	'linear-rgb->oklch': chain(linearRgbToOklab, oklabToOklch),
	'oklch->linear-rgb': chain(oklchToOklab, oklabToLinearRgb),

	// hsl ↔ linear-rgb
	'hsl->linear-rgb': chain(hslToSrgb, srgbToLinear),
	'linear-rgb->hsl': chain(linearToSrgb, srgbToHsl),

	// hsl ↔ oklab
	'hsl->oklab': chain(hslToSrgb, srgbToLinear, linearRgbToOklab),
	'oklab->hsl': chain(oklabToLinearRgb, linearToSrgb, srgbToHsl),

	// hsl ↔ oklch
	'hsl->oklch': chain(hslToSrgb, srgbToLinear, linearRgbToOklab, oklabToOklch),
	'oklch->hsl': chain(oklchToOklab, oklabToLinearRgb, linearToSrgb, srgbToHsl),
};

/**
 * Convert a Color to a target color space.
 *
 * Supports all directed pairs among: srgb, linear-rgb, oklab, oklch, hsl.
 */
export function convert<S extends ColorSpace>(
	color: Color,
	to: S,
): ColorInSpace<S> {
	if (color.space === to) {
		return { ...color } as ColorInSpace<S>;
	}

	const key = `${color.space}->${to}`;
	const fn = conversions[key];
	if (!fn) {
		throw new Error(`Unsupported conversion: ${color.space} → ${to}`);
	}

	return fn(color) as ColorInSpace<S>;
}
