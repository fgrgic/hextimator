import { convert } from '../convert';
import { parse } from '../parse';
import type { Color } from '../types';
import { SURFACE_SCALE } from './consts';
import { resolveMergedThemeAdjustments } from './mergeThemeAdjustments';
import type { ColorScale, GenerateOptions, ThemeType } from './types';
import { expandColorToScale, wrapHue } from './utils';

const BASELINE_MAX_CHROMA = 0.01;

export function generateSurface(
	color: Color,
	themeType: ThemeType,
	options?: GenerateOptions,
): ColorScale {
	const invertSurfaceAndAccent =
		themeType === 'dark' && options?.invertDarkModeSurfaceAccent;

	const themeAdjustments = resolveMergedThemeAdjustments(
		themeType,
		options ?? {},
	);
	const effectiveSurfaceColor = themeAdjustments.surfaceColor;

	const preferredSurfaceColorInput = invertSurfaceAndAccent
		? (color ?? effectiveSurfaceColor)
		: (effectiveSurfaceColor ?? color);

	const surfaceMaxChroma =
		themeAdjustments.surfaceMaxChroma ?? BASELINE_MAX_CHROMA;

	const preferredSurfaceColor = convert(
		parse(preferredSurfaceColorInput),
		'oklch',
	);

	let surfaceHue = preferredSurfaceColor.h;
	const surfaceChroma = Math.min(preferredSurfaceColor.c, surfaceMaxChroma);

	const surfaceHueShift = themeAdjustments.surfaceHueShift ?? 0;
	if (
		surfaceHueShift !== 0 &&
		!effectiveSurfaceColor &&
		!invertSurfaceAndAccent
	) {
		surfaceHue = wrapHue(convert(color, 'oklch').h + surfaceHueShift);
	}

	const s = themeType === 'light' ? SURFACE_SCALE.light : SURFACE_SCALE.dark;

	const normalizedPreferredSurfaceColor = {
		...preferredSurfaceColor,
		h: surfaceHue,
		c: surfaceChroma,
		l: s.L,
	};

	return expandColorToScale(normalizedPreferredSurfaceColor, themeType, {
		...(options ?? {}),
		baselineLValueLight: SURFACE_SCALE.light.L,
		baselineLValueDark: SURFACE_SCALE.dark.L,
		strongDeltaLight: SURFACE_SCALE.light.strong,
		strongDeltaDark: SURFACE_SCALE.dark.strong,
		weakDeltaLight: SURFACE_SCALE.light.weak,
		weakDeltaDark: SURFACE_SCALE.dark.weak,
	});
}
