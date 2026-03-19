import { convert } from '../convert';
import type { Color } from '../types';
import {
	DEFAULT_THEME_LIGHTNESS,
	DEFAULT_THEME_LIGHTNESS_DARK_DELTA,
	DEFAULT_THEME_LIGHTNESS_LIGHT_DELTA,
} from './consts';
import type { ColorScale, GenerateOptions, ThemeType } from './types';

const FOREGROUND_DARK_L_VALUE = 0.98;
const FOREGROUND_LIGHT_L_VALUE = 0.02;
const FOREGROUND_MAX_CHROMA = 0.05;

const STRONG_DELTA_DARK = 0.05;
const STRONG_DELTA_LIGHT = -0.05;
const WEAK_DELTA_DARK = -0.05;
const WEAK_DELTA_LIGHT = 0.05;

interface ExpandColorToScaleOptions
	extends Pick<GenerateOptions, 'themeLightness'> {
	lightDelta?: number;
	darkDelta?: number;
	baselineLValueDark?: number;
	baselineLValueLight?: number;
	foregroundLValueDark?: number;
	foregroundLValueLight?: number;
	foregroundMaxChroma?: number;
	strongDeltaDark?: number;
	strongDeltaLight?: number;
	weakDeltaDark?: number;
	weakDeltaLight?: number;
}

export function expandColorToScale(
	color: Color,
	themeType: ThemeType,
	options?: ExpandColorToScaleOptions,
): ColorScale {
	const {
		baselineLValueDark,
		baselineLValueLight,
		themeLightness,
		foregroundLValueDark = FOREGROUND_DARK_L_VALUE,
		foregroundLValueLight = FOREGROUND_LIGHT_L_VALUE,
		foregroundMaxChroma = FOREGROUND_MAX_CHROMA,
		strongDeltaDark = STRONG_DELTA_DARK,
		strongDeltaLight = STRONG_DELTA_LIGHT,
		weakDeltaDark = WEAK_DELTA_DARK,
		weakDeltaLight = WEAK_DELTA_LIGHT,
	} = options ?? {};

	const { lightThemeLightnessValue, darkThemeLightnessValue } =
		generateLightnessPair(themeLightness, options);

	const colorOKLCH = convert(color, 'oklch');
	const normalizedColorOKLCH = {
		...colorOKLCH,
		l:
			themeType === 'light'
				? (baselineLValueLight ?? lightThemeLightnessValue)
				: (baselineLValueDark ?? darkThemeLightnessValue),
	};

	const strongColorOKLCH = {
		...normalizedColorOKLCH,
		l:
			normalizedColorOKLCH.l +
			(themeType === 'light' ? strongDeltaLight : strongDeltaDark),
	};

	const weakColorOKLCH = {
		...normalizedColorOKLCH,
		l:
			normalizedColorOKLCH.l +
			(themeType === 'light' ? weakDeltaLight : weakDeltaDark),
	};

	const candidates = [foregroundLValueLight, foregroundLValueDark].map((l) => ({
		...normalizedColorOKLCH,
		l,
		c: Math.min(normalizedColorOKLCH.c, foregroundMaxChroma),
	}));

	const [preferred, fallback] =
		themeType === 'light' ? candidates : candidates.toReversed();

	const foregroundColorOKLCH =
		calculateContrast(normalizedColorOKLCH, preferred) > 7
			? preferred
			: fallback;

	return {
		DEFAULT: convert(normalizedColorOKLCH, 'srgb'),
		strong: convert(strongColorOKLCH, 'srgb'),
		weak: convert(weakColorOKLCH, 'srgb'),
		foreground: convert(foregroundColorOKLCH, 'srgb'),
	};
}

/**
 * Based on the preferred lightness (of the theme)
 * Generates the lightness pair for dark and light theme
 * @param lightness number between 0 and 1
 */
export function generateLightnessPair(
	lightness?: number,
	options?: { darkDelta?: number; lightDelta?: number },
) {
	const themeLightness = lightness ?? DEFAULT_THEME_LIGHTNESS;

	const lightDelta = options?.lightDelta ?? DEFAULT_THEME_LIGHTNESS_LIGHT_DELTA;
	const darkDelta = options?.darkDelta ?? DEFAULT_THEME_LIGHTNESS_DARK_DELTA;

	const lightThemeLightnessValue = Math.min(themeLightness + lightDelta, 1);
	const darkThemeLightnessValue = Math.max(themeLightness + darkDelta, 0);

	return {
		lightThemeLightnessValue,
		darkThemeLightnessValue,
	};
}

export function calculateContrast(colorA: Color, colorB: Color): number {
	const luminance = (color: Color): number => {
		const { r, g, b } = convert(color, 'linear-rgb');
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};

	const L1 = luminance(colorA);
	const L2 = luminance(colorB);
	const lighter = Math.max(L1, L2);
	const darker = Math.min(L1, L2);
	return (lighter + 0.05) / (darker + 0.05);
}
