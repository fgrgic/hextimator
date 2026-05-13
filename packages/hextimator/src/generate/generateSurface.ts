import { convert } from '../convert';
import { parse } from '../parse';
import type { Color } from '../types';
import type { ColorScale, GenerateOptions, ThemeType } from './types';
import { expandColorToScale, wrapHue } from './utils';

const BASELINE_DARK_L_VALUE = 0.2;
const BASELINE_LIGHT_L_VALUE = 0.97;

const BASELINE_MAX_CHROMA = 0.01;

const STRONG_DELTA_DARK = -0.1;
const STRONG_DELTA_LIGHT = 0.02;
const WEAK_DELTA_DARK = 0.1;
const WEAK_DELTA_LIGHT = -0.03;

export function generateSurface(
	color: Color,
	themeType: ThemeType,
	options?: GenerateOptions,
): ColorScale {
	const invertSurfaceAndAccent =
		themeType === 'dark' && options?.invertDarkModeSurfaceAccent;

	const preferredSurfaceColorInput = invertSurfaceAndAccent
		? (color ?? options?.surfaceColor)
		: (options?.surfaceColor ?? color);

	const themeAdjustments =
		themeType === 'light' ? options?.light : options?.dark;
	const surfaceMaxChroma =
		themeAdjustments?.surfaceMaxChroma ??
		options?.surfaceMaxChroma ??
		BASELINE_MAX_CHROMA;

	const preferredSurfaceColor = convert(
		parse(preferredSurfaceColorInput),
		'oklch',
	);

	let surfaceHue = preferredSurfaceColor.h;
	const surfaceChroma = Math.min(preferredSurfaceColor.c, surfaceMaxChroma);

	const surfaceHueShift = options?.surfaceHueShift ?? 0;
	if (
		surfaceHueShift !== 0 &&
		!options?.surfaceColor &&
		!invertSurfaceAndAccent
	) {
		surfaceHue = wrapHue(convert(color, 'oklch').h + surfaceHueShift);
	}

	const normalizedPreferredSurfaceColor = {
		...preferredSurfaceColor,
		h: surfaceHue,
		c: surfaceChroma,
		l: themeType === 'light' ? BASELINE_LIGHT_L_VALUE : BASELINE_DARK_L_VALUE,
	};

	return expandColorToScale(normalizedPreferredSurfaceColor, themeType, {
		baselineLValueDark: BASELINE_DARK_L_VALUE,
		baselineLValueLight: BASELINE_LIGHT_L_VALUE,
		strongDeltaDark: STRONG_DELTA_DARK,
		strongDeltaLight: STRONG_DELTA_LIGHT,
		weakDeltaDark: WEAK_DELTA_DARK,
		weakDeltaLight: WEAK_DELTA_LIGHT,
		minContrastRatio: options?.minContrastRatio,
		hueShift: options?.hueShift,
		foregroundMaxChroma: options?.foregroundMaxChroma,
		light: options?.light,
		dark: options?.dark,
	});
}
