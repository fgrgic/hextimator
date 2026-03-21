import type { Color, ColorInSpace, ColorSpace, OKLCH } from '../types';
import { gamutMapOklch, gamutMapOklchToP3 } from './gamut';
import { linearRgbToOklab, oklabToLinearRgb } from './linear-oklab';
import { oklabToOklch, oklchToOklab } from './oklab-oklch';
import { hslToSrgb, srgbToHsl } from './srgb-hsl';
import { linearToSrgb, srgbToLinear } from './srgb-linear';
import {
	displayP3ToLinearSrgb,
	displayP3ToSrgb,
	linearSrgbToDisplayP3,
	srgbToDisplayP3,
} from './srgb-p3';

type ConvertFn = (color: Color) => Color;

/** Gamut-map an OKLCH color to sRGB before converting to a gamut-bounded space. */
const gamutMap = ((color: Color) => gamutMapOklch(color as OKLCH)) as ConvertFn;

/** Gamut-map an OKLCH color to Display P3 before converting. */
const gamutMapP3 = ((color: Color) =>
	gamutMapOklchToP3(color as OKLCH)) as ConvertFn;

/** Chain multiple conversion functions into one. */
// biome-ignore lint/suspicious/noExplicitAny: each fn takes a narrow Color variant; type safety is enforced by the conversion table keys
function chain(...fns: Array<(color: any) => Color>): ConvertFn {
	return (color: Color) => fns.reduce((c, fn) => fn(c), color);
}

/**
 * Lookup table for all directed pairs among: srgb, linear-rgb, oklab, oklch, hsl, display-p3.
 * Each entry is a function that converts from the key's source to its target.
 *
 * Type safety is enforced at the public `convert()` boundary — each converter
 * receives the correct narrow type because the lookup key matches `color.space`.
 */
const conversions = {
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

	// oklab / oklch → srgb (gamut-mapped)
	'oklab->srgb': chain(oklabToLinearRgb, linearToSrgb),
	'oklch->srgb': chain(gamutMap, oklchToOklab, oklabToLinearRgb, linearToSrgb),

	// linear-rgb → oklch
	'linear-rgb->oklch': chain(linearRgbToOklab, oklabToOklch),
	'oklch->linear-rgb': chain(gamutMap, oklchToOklab, oklabToLinearRgb),

	// hsl ↔ linear-rgb
	'hsl->linear-rgb': chain(hslToSrgb, srgbToLinear),
	'linear-rgb->hsl': chain(linearToSrgb, srgbToHsl),

	// hsl ↔ oklab
	'hsl->oklab': chain(hslToSrgb, srgbToLinear, linearRgbToOklab),
	'oklab->hsl': chain(oklabToLinearRgb, linearToSrgb, srgbToHsl),

	// hsl ↔ oklch
	'hsl->oklch': chain(hslToSrgb, srgbToLinear, linearRgbToOklab, oklabToOklch),
	'oklch->hsl': chain(
		gamutMap,
		oklchToOklab,
		oklabToLinearRgb,
		linearToSrgb,
		srgbToHsl,
	),

	// display-p3 ↔ srgb
	'display-p3->srgb': displayP3ToSrgb,
	'srgb->display-p3': srgbToDisplayP3,

	// display-p3 ↔ linear-rgb
	'display-p3->linear-rgb': displayP3ToLinearSrgb,
	'linear-rgb->display-p3': linearSrgbToDisplayP3,

	// display-p3 ↔ oklab
	'display-p3->oklab': chain(displayP3ToLinearSrgb, linearRgbToOklab),
	'oklab->display-p3': chain(oklabToLinearRgb, linearSrgbToDisplayP3),

	// display-p3 ↔ oklch
	'display-p3->oklch': chain(
		displayP3ToLinearSrgb,
		linearRgbToOklab,
		oklabToOklch,
	),
	'oklch->display-p3': chain(
		gamutMapP3,
		oklchToOklab,
		oklabToLinearRgb,
		linearSrgbToDisplayP3,
	),

	// display-p3 ↔ hsl (via srgb)
	'display-p3->hsl': chain(displayP3ToSrgb, srgbToHsl),
	'hsl->display-p3': chain(hslToSrgb, srgbToDisplayP3),
} as Record<string, ConvertFn>;

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
