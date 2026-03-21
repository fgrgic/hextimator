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

const FALLBACK_STRONG_DELTA_DARK = 0.05;
const FALLBACK_STRONG_DELTA_LIGHT = -0.05;
const FALLBACK_WEAK_DELTA_DARK = -0.05;
const FALLBACK_WEAK_DELTA_LIGHT = 0.05;

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
		strongDeltaDark,
		strongDeltaLight,
		weakDeltaDark,
		weakDeltaLight,
	} = options ?? {};

	const hasExplicitDeltas =
		strongDeltaDark !== undefined ||
		strongDeltaLight !== undefined ||
		weakDeltaDark !== undefined ||
		weakDeltaLight !== undefined;

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

	const candidates = [foregroundLValueLight, foregroundLValueDark].map((l) => ({
		...normalizedColorOKLCH,
		l,
		c: Math.min(normalizedColorOKLCH.c, foregroundMaxChroma),
	}));

	const [preferred, fallback] =
		themeType === 'light' ? candidates : [...candidates].reverse();

	const foregroundColorOKLCH =
		calculateContrast(normalizedColorOKLCH, preferred) > 7
			? preferred
			: fallback;

	let strongColorOKLCH: typeof normalizedColorOKLCH;
	let weakColorOKLCH: typeof normalizedColorOKLCH;

	if (hasExplicitDeltas) {
		const sd =
			themeType === 'light'
				? (strongDeltaLight ?? FALLBACK_STRONG_DELTA_LIGHT)
				: (strongDeltaDark ?? FALLBACK_STRONG_DELTA_DARK);
		const wd =
			themeType === 'light'
				? (weakDeltaLight ?? FALLBACK_WEAK_DELTA_LIGHT)
				: (weakDeltaDark ?? FALLBACK_WEAK_DELTA_DARK);

		strongColorOKLCH = {
			...normalizedColorOKLCH,
			l: normalizedColorOKLCH.l + sd,
		};
		weakColorOKLCH = {
			...normalizedColorOKLCH,
			l: normalizedColorOKLCH.l + wd,
		};
	} else {
		// Compute boundary for BOTH themes so we can use the smaller delta,
		// ensuring consistent lightness steps between light and dark.
		const lightDefaultL = baselineLValueLight ?? lightThemeLightnessValue;
		const darkDefaultL = baselineLValueDark ?? darkThemeLightnessValue;

		const lightDefaultColor = { ...colorOKLCH, l: lightDefaultL };
		const darkDefaultColor = { ...colorOKLCH, l: darkDefaultL };

		const lightFgColor = {
			...colorOKLCH,
			l: foregroundLValueLight,
			c: Math.min(colorOKLCH.c, foregroundMaxChroma),
		};
		const darkFgColor = {
			...colorOKLCH,
			l: foregroundLValueDark,
			c: Math.min(colorOKLCH.c, foregroundMaxChroma),
		};

		// Pick the correct foreground for each theme (same logic as above)
		const lightFg =
			calculateContrast(lightDefaultColor, lightFgColor) > 7
				? lightFgColor
				: darkFgColor;
		const darkFg =
			calculateContrast(darkDefaultColor, darkFgColor) > 7
				? darkFgColor
				: lightFgColor;

		const lightBoundaryL = findContrastBoundaryLightness(
			lightDefaultColor,
			lightFg,
		);
		const darkBoundaryL = findContrastBoundaryLightness(
			darkDefaultColor,
			darkFg,
		);

		const lightDelta = lightBoundaryL !== null
			? Math.abs(lightDefaultL - lightBoundaryL)
			: null;
		const darkDelta = darkBoundaryL !== null
			? Math.abs(darkDefaultL - darkBoundaryL)
			: null;

		// Use the smaller of the two deltas for symmetry
		const symmetricDelta =
			lightDelta !== null && darkDelta !== null
				? Math.min(lightDelta, darkDelta)
				: lightDelta ?? darkDelta;

		if (symmetricDelta !== null) {
			const foregroundDirection = Math.sign(
				foregroundColorOKLCH.l - normalizedColorOKLCH.l,
			);

			strongColorOKLCH = {
				...normalizedColorOKLCH,
				l: Math.max(
					0,
					Math.min(1, normalizedColorOKLCH.l + symmetricDelta * foregroundDirection),
				),
			};
			weakColorOKLCH = {
				...normalizedColorOKLCH,
				l: Math.max(
					0,
					Math.min(1, normalizedColorOKLCH.l - symmetricDelta * foregroundDirection),
				),
			};
		} else {
			const sd =
				themeType === 'light'
					? FALLBACK_STRONG_DELTA_LIGHT
					: FALLBACK_STRONG_DELTA_DARK;
			const wd =
				themeType === 'light'
					? FALLBACK_WEAK_DELTA_LIGHT
					: FALLBACK_WEAK_DELTA_DARK;

			strongColorOKLCH = {
				...normalizedColorOKLCH,
				l: normalizedColorOKLCH.l + sd,
			};
			weakColorOKLCH = {
				...normalizedColorOKLCH,
				l: normalizedColorOKLCH.l + wd,
			};
		}
	}

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

export function findContrastBoundaryLightness(
	defaultColor: Color,
	foregroundColor: Color,
	targetContrast = 7,
): number | null {
	const defaultOKLCH = convert(defaultColor, 'oklch');
	const foregroundOKLCH = convert(foregroundColor, 'oklch');

	const defaultContrast = calculateContrast(defaultColor, foregroundColor);
	if (defaultContrast <= targetContrast) {
		return null;
	}

	const { r: fr, g: fg, b: fb } = convert(foregroundColor, 'linear-rgb');
	const foregroundLuminance = 0.2126 * fr + 0.7152 * fg + 0.0722 * fb;

	let tLo = 0;
	let tHi = 1;

	for (let i = 0; i < 20; i++) {
		const tMid = (tLo + tHi) / 2;
		const l = defaultOKLCH.l + tMid * (foregroundOKLCH.l - defaultOKLCH.l);
		const testColor = { ...defaultOKLCH, l };

		const { r, g, b } = convert(testColor, 'linear-rgb');
		const testLuminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

		const lighter = Math.max(testLuminance, foregroundLuminance);
		const darker = Math.min(testLuminance, foregroundLuminance);
		const contrast = (lighter + 0.05) / (darker + 0.05);

		if (contrast > targetContrast) {
			tLo = tMid;
		} else {
			tHi = tMid;
		}
	}

	return defaultOKLCH.l + ((tLo + tHi) / 2) * (foregroundOKLCH.l - defaultOKLCH.l);
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
