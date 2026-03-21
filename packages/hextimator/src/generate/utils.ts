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
 * Small buffer above the target to absorb gamut-mapping drift.
 * gamut mapping can shift perceived lightness by up to ~0.1, so 0.15 provides safety
 */
const CONTRAST_MARGIN = 0.15;

export function resolveContrastRatio(
	value: 'AAA' | 'AA' | number | undefined,
): number {
	if (value === undefined || value === 'AAA') return 7;
	if (value === 'AA') return 4.5;
	return value;
}

interface ExpandColorToScaleOptions
	extends Pick<GenerateOptions, 'themeLightness' | 'minContrastRatio'> {
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
		minContrastRatio: minContrastRatioOption,
		foregroundLValueDark = FOREGROUND_DARK_L_VALUE,
		foregroundLValueLight = FOREGROUND_LIGHT_L_VALUE,
		foregroundMaxChroma = FOREGROUND_MAX_CHROMA,
		strongDeltaDark,
		strongDeltaLight,
		weakDeltaDark,
		weakDeltaLight,
	} = options ?? {};

	const minContrast = resolveContrastRatio(minContrastRatioOption);
	const contrastTarget = minContrast + CONTRAST_MARGIN;

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
		calculateContrast(normalizedColorOKLCH, preferred) > minContrast
			? preferred
			: fallback;

	// If neither foreground meets the target, adjust the color's lightness
	// minimally until the preferred foreground meets the threshold.
	if (
		calculateContrast(normalizedColorOKLCH, foregroundColorOKLCH) <
		contrastTarget
	) {
		// In dark mode, go darker so a light foreground gains contrast.
		// In light mode, go lighter so a dark foreground gains contrast.
		const direction = themeType === 'light' ? 1 : -1;
		let lo = direction === 1 ? normalizedColorOKLCH.l : 0;
		let hi = direction === 1 ? 1 : normalizedColorOKLCH.l;

		for (let i = 0; i < 20; i++) {
			const mid = (lo + hi) / 2;
			const testColor = { ...normalizedColorOKLCH, l: mid };
			if (calculateContrast(testColor, preferred) > contrastTarget) {
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
			contrastTarget,
		);
		const maxStrongDelta =
			boundaryL !== null ? Math.abs(normalizedColorOKLCH.l - boundaryL) : 0;
		const strongDelta = Math.min(VARIANT_DELTA, maxStrongDelta);

		strongColorOKLCH = {
			...normalizedColorOKLCH,
			l: Math.max(
				0,
				Math.min(1, normalizedColorOKLCH.l + strongDelta * contrastDirection),
			),
		};
		weakColorOKLCH = {
			...normalizedColorOKLCH,
			l: Math.max(
				0,
				Math.min(1, normalizedColorOKLCH.l - weakDelta * contrastDirection),
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
 * Safe lightness bounds that guarantee AAA contrast (7:1 + margin)
 * against near-white (L=0.98) and near-black (L=0.02) foregrounds.
 * Light theme needs high lightness (dark text on light bg).
 * Dark theme needs low lightness (light text on dark bg).
 */
const LIGHT_THEME_LIGHTNESS_RANGE = [0.69, 0.99] as const;
const DARK_THEME_LIGHTNESS_RANGE = [0.2, 0.43] as const;

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

	const lightThemeLightnessValue = Math.min(
		Math.max(themeLightness + lightDelta, LIGHT_THEME_LIGHTNESS_RANGE[0]),
		LIGHT_THEME_LIGHTNESS_RANGE[1],
	);
	const darkThemeLightnessValue = Math.min(
		Math.max(themeLightness + darkDelta, DARK_THEME_LIGHTNESS_RANGE[0]),
		DARK_THEME_LIGHTNESS_RANGE[1],
	);

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
