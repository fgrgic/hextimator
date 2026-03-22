import { convert } from '../convert';
import { parse } from '../parse';
import type { Color } from '../types';
import type { ColorScale, GenerateOptions, ThemeType } from './types';
import { expandColorToScale } from './utils';

const BASELINE_DARK_L_VALUE = 0.2;
const BASELINE_LIGHT_L_VALUE = 0.97;

const BASELINE_MAX_CHROMA = 0.01;

const STRONG_DELTA_DARK = -0.1;
const STRONG_DELTA_LIGHT = 0.03;
const WEAK_DELTA_DARK = 0.1;
const WEAK_DELTA_LIGHT = -0.03;

export function generateBase(
	color: Color,
	themeType: ThemeType,
	options?: GenerateOptions,
): ColorScale {
	const invertBaseAndAccent =
		themeType === 'dark' && options?.invertDarkModeBaseAccent;

	const preferredBaseColorInput = invertBaseAndAccent
		? (color ?? options?.baseColor)
		: (options?.baseColor ?? color);

	const baselineMaxChroma = options?.baseMaxChroma ?? BASELINE_MAX_CHROMA;

	const preferredBaseColor = convert(parse(preferredBaseColorInput), 'oklch');

	const normalizedPreferredBaseColor = {
		...preferredBaseColor,
		c: Math.min(preferredBaseColor.c, baselineMaxChroma),
		l: themeType === 'light' ? BASELINE_LIGHT_L_VALUE : BASELINE_DARK_L_VALUE,
	};

	return expandColorToScale(normalizedPreferredBaseColor, themeType, {
		baselineLValueDark: BASELINE_DARK_L_VALUE,
		baselineLValueLight: BASELINE_LIGHT_L_VALUE,
		strongDeltaDark: STRONG_DELTA_DARK,
		strongDeltaLight: STRONG_DELTA_LIGHT,
		weakDeltaDark: WEAK_DELTA_DARK,
		weakDeltaLight: WEAK_DELTA_LIGHT,
		minContrastRatio: options?.minContrastRatio,
	});
}
