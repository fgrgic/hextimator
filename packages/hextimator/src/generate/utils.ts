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

const VARIANT_DELTA = 0.1;

/**
 * Target slightly above 7 to absorb gamut-mapping drift.
 */
const AAA_TARGET = 7.15;

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

	let foregroundColorOKLCH =
		calculateContrast(normalizedColorOKLCH, preferred) > 7
			? preferred
			: fallback;

	// If neither foreground achieves AAA (7:1), adjust the color's lightness
	// minimally until the preferred foreground meets the threshold.
	if (
		calculateContrast(normalizedColorOKLCH, foregroundColorOKLCH) < AAA_TARGET
	) {
		// In dark mode, go darker so a light foreground gains contrast.
		// In light mode, go lighter so a dark foreground gains contrast.
		const direction = themeType === 'light' ? 1 : -1;
		let lo = direction === 1 ? normalizedColorOKLCH.l : 0;
		let hi = direction === 1 ? 1 : normalizedColorOKLCH.l;

		for (let i = 0; i < 20; i++) {
			const mid = (lo + hi) / 2;
			const testColor = { ...normalizedColorOKLCH, l: mid };
			if (calculateContrast(testColor, preferred) > AAA_TARGET) {
				if (direction === 1) hi = mid;
				else lo = mid;
			} else {
				if (direction === 1) lo = mid;
				else hi = mid;
			}
		}

		normalizedColorOKLCH.l = (lo + hi) / 2;
		foregroundColorOKLCH = preferred;
	}

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
		// Strong increases contrast (toward foreground), weak decreases it.
		// In light mode (light base), strong goes darker (-1).
		// In dark mode (dark base), strong goes lighter (+1).
		const contrastDirection = themeType === 'light' ? -1 : 1;

		// Use a fixed delta for consistency across hues.
		// Weak always moves away from foreground, so it's always safe.
		const weakDelta = VARIANT_DELTA;

		// Strong moves toward the foreground — clamp it so it doesn't
		// cross the contrast boundary (preserve AAA on DEFAULT).
		const boundaryL = findContrastBoundaryLightness(
			normalizedColorOKLCH,
			foregroundColorOKLCH,
			AAA_TARGET,
		);
		const maxStrongDelta =
			boundaryL !== null
				? Math.abs(normalizedColorOKLCH.l - boundaryL)
				: 0;
		const strongDelta = Math.min(VARIANT_DELTA, maxStrongDelta);

		strongColorOKLCH = {
			...normalizedColorOKLCH,
			l: Math.max(
				0,
				Math.min(
					1,
					normalizedColorOKLCH.l + strongDelta * contrastDirection,
				),
			),
		};
		weakColorOKLCH = {
			...normalizedColorOKLCH,
			l: Math.max(
				0,
				Math.min(
					1,
					normalizedColorOKLCH.l - weakDelta * contrastDirection,
				),
			),
		};
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

	return (
		defaultOKLCH.l + ((tLo + tHi) / 2) * (foregroundOKLCH.l - defaultOKLCH.l)
	);
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
