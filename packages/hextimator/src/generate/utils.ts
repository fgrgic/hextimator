import { convert } from '../convert';
import type { Color, HextimateStyleOptions, OKLCH } from '../types';
import {
	DEFAULT_DARK_THEME_LIGHTNESS,
	DEFAULT_LIGHT_THEME_LIGHTNESS,
} from './consts';
import type { ColorScale, GenerateOptions, ThemeType } from './types';

const FOREGROUND_DARK_L_VALUE = 0.97;
const FOREGROUND_LIGHT_L_VALUE = 0.1;
const FOREGROUND_MAX_CHROMA = 0.01;

const FALLBACK_STRONG_DELTA_DARK = 0.05;
const FALLBACK_STRONG_DELTA_LIGHT = -0.05;
const FALLBACK_WEAK_DELTA_DARK = -0.05;
const FALLBACK_WEAK_DELTA_LIGHT = 0.05;

const VARIANT_DELTA = 0.1;

// Skip exact chip when strong would be capped to a tiny OKLCH step (distToBoundary).
const EXACT_CHIP_MIN_STRONG_DELTA_OKLCH = VARIANT_DELTA / 2;

/** Clamp for theme anchor lightness; aligns with AAA-style contrast reasoning in docs. */
const LIGHT_THEME_LIGHTNESS_RANGE = [0.4, 0.99] as const;
const DARK_THEME_LIGHTNESS_RANGE = [0.2, 0.8] as const;

/** Light accent/semantic fills: ceiling below OKLCH 1 so `weak` does not flatten to pure white (~surface). Ignored when `baselineLValueLight` is set (surface scale). */
const LIGHT_ACCENT_MAX_LIGHTNESS = 0.98;

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

export function clampHueShift(hueShift: number, totalVariants: number): number {
	if (totalVariants <= 0) return hueShift;
	const max = 360 / (totalVariants + 1);
	const sign = Math.sign(hueShift);
	return sign * Math.min(Math.abs(hueShift), max);
}

export function wrapHue(h: number): number {
	return ((h % 360) + 360) % 360;
}

function oklchBodyClose(a: OKLCH, b: OKLCH): boolean {
	const eps = 1e-5;
	let dh = Math.abs(a.h - b.h) % 360;
	if (dh > 180) dh = 360 - dh;
	return Math.abs(a.l - b.l) < eps && Math.abs(a.c - b.c) < eps && dh < 0.05;
}

function pickAccentForegroundPair(
	base: OKLCH,
	themeType: ThemeType,
	foregroundLValueLight: number,
	foregroundLValueDark: number,
	foregroundMaxChroma: number,
	minContrast: number,
): { foreground: OKLCH; preferred: OKLCH } {
	const candidates = [foregroundLValueLight, foregroundLValueDark].map((l) => ({
		...base,
		l,
		c: Math.min(base.c, foregroundMaxChroma),
	}));

	const [candidateA, candidateB] =
		themeType === 'light' ? candidates : [...candidates].reverse();

	const contrastA = calculateContrast(base, candidateA);
	const contrastB = calculateContrast(base, candidateB);

	const [preferred, fallback] =
		contrastA >= contrastB
			? [candidateA, candidateB]
			: [candidateB, candidateA];

	const foreground =
		calculateContrast(base, preferred) > minContrast ? preferred : fallback;
	return { foreground, preferred };
}

function computeStrongWeakWithoutBoundaryShift(
	base: OKLCH,
	foreground: OKLCH,
	themeType: ThemeType,
	contrastTarget: number,
): { strong: OKLCH; weak: OKLCH } {
	const contrastDirection = themeType === 'light' ? -1 : 1;

	const boundaryL = findContrastBoundaryLightness(
		base,
		foreground,
		contrastTarget,
	);
	const distToBoundary = boundaryL !== null ? Math.abs(base.l - boundaryL) : 0;

	const strongDelta = Math.min(VARIANT_DELTA, distToBoundary);

	const weakCandidateColor = {
		...base,
		l: base.l - VARIANT_DELTA * contrastDirection,
	};
	let weakDelta = VARIANT_DELTA;
	if (calculateContrast(weakCandidateColor, foreground) < contrastTarget) {
		let lo = 0;
		let hi = VARIANT_DELTA;
		for (let i = 0; i < 20; i++) {
			const mid = (lo + hi) / 2;
			const testL = base.l - mid * contrastDirection;
			const testColor = { ...base, l: testL };
			if (calculateContrast(testColor, foreground) > contrastTarget) {
				lo = mid;
			} else {
				hi = mid;
			}
		}
		weakDelta = lo;
	}

	const strong: OKLCH = {
		...base,
		l: Math.max(0, Math.min(1, base.l + strongDelta * contrastDirection)),
	};
	const weak: OKLCH = {
		...base,
		l: Math.max(0, Math.min(1, base.l - weakDelta * contrastDirection)),
	};
	return { strong, weak };
}

/** Light accent fills: cap high L, then satisfy contrast vs fg. No-op for surface baselines (skipSurfaceCap). */
function constrainLightVariant(
	themeType: ThemeType,
	variant: OKLCH,
	foreground: OKLCH,
	contrastTarget: number,
	skipSurfaceCap: boolean,
): OKLCH {
	if (themeType !== 'light' || skipSurfaceCap) return variant;

	let v =
		variant.l > LIGHT_ACCENT_MAX_LIGHTNESS
			? { ...variant, l: LIGHT_ACCENT_MAX_LIGHTNESS }
			: variant;
	v = ensureContrast(v, foreground, contrastTarget);
	if (v.l > LIGHT_ACCENT_MAX_LIGHTNESS)
		v = { ...v, l: LIGHT_ACCENT_MAX_LIGHTNESS };
	return v;
}

interface ExpandColorToScaleOptions
	extends Pick<
		GenerateOptions,
		'minContrastRatio' | 'hueShift' | 'light' | 'dark' | 'inputLightness'
	> {
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
		minContrastRatio: minContrastRatioOption,
		foregroundLValueDark = FOREGROUND_DARK_L_VALUE,
		foregroundLValueLight = FOREGROUND_LIGHT_L_VALUE,
		foregroundMaxChroma: foregroundMaxChromaOption = FOREGROUND_MAX_CHROMA,
		strongDeltaDark,
		strongDeltaLight,
		weakDeltaDark,
		weakDeltaLight,
	} = options ?? {};

	const themeAdjustments =
		themeType === 'light' ? options?.light : options?.dark;
	const foregroundMaxChroma =
		themeAdjustments?.foregroundMaxChroma ?? foregroundMaxChromaOption;

	const minContrast = resolveContrastRatio(
		themeAdjustments?.minContrastRatio ?? minContrastRatioOption,
	);
	const contrastTarget = minContrast + CONTRAST_MARGIN;

	const hasExplicitDeltas =
		strongDeltaDark !== undefined ||
		strongDeltaLight !== undefined ||
		weakDeltaDark !== undefined ||
		weakDeltaLight !== undefined;

	const themeLightness = resolveThemeLightness(themeType, options);

	const colorOKLCH = convert(color, 'oklch');

	const maxChroma =
		themeType === 'light'
			? options?.light?.maxChroma
			: options?.dark?.maxChroma;

	const chipOKLCH: OKLCH = {
		...colorOKLCH,
		c:
			maxChroma !== undefined
				? Math.min(colorOKLCH.c, maxChroma)
				: colorOKLCH.c,
	};

	const isSurfaceScale =
		baselineLValueLight !== undefined || baselineLValueDark !== undefined;

	const rawHueShift = options?.hueShift ?? 0;

	let useExactChip = false;
	if (!isSurfaceScale && !hasExplicitDeltas && rawHueShift === 0) {
		const range =
			themeType === 'light'
				? LIGHT_THEME_LIGHTNESS_RANGE
				: DARK_THEME_LIGHTNESS_RANGE;
		if (chipOKLCH.l >= range[0] && chipOKLCH.l <= range[1]) {
			const chipFg = pickAccentForegroundPair(
				chipOKLCH,
				themeType,
				foregroundLValueLight,
				foregroundLValueDark,
				foregroundMaxChroma,
				minContrast,
			).foreground;
			if (calculateContrast(chipOKLCH, chipFg) >= contrastTarget) {
				const chipBoundaryL = findContrastBoundaryLightness(
					chipOKLCH,
					chipFg,
					contrastTarget,
				);
				const chipDistToBoundary =
					chipBoundaryL !== null ? Math.abs(chipOKLCH.l - chipBoundaryL) : 0;
				const chipStrongDelta = Math.min(VARIANT_DELTA, chipDistToBoundary);

				if (chipStrongDelta >= EXACT_CHIP_MIN_STRONG_DELTA_OKLCH) {
					const { strong: strongSim, weak: weakSim } =
						computeStrongWeakWithoutBoundaryShift(
							chipOKLCH,
							chipFg,
							themeType,
							contrastTarget,
						);
					const defF = constrainLightVariant(
						themeType,
						chipOKLCH,
						chipFg,
						contrastTarget,
						false,
					);
					const sF = constrainLightVariant(
						themeType,
						strongSim,
						chipFg,
						contrastTarget,
						false,
					);
					const wF = constrainLightVariant(
						themeType,
						weakSim,
						chipFg,
						contrastTarget,
						false,
					);

					useExactChip =
						oklchBodyClose(defF, chipOKLCH) &&
						calculateContrast(defF, chipFg) >= contrastTarget &&
						calculateContrast(sF, chipFg) >= contrastTarget &&
						calculateContrast(wF, chipFg) >= contrastTarget;
				}
			}
		}
	}

	let normalizedColorOKLCH: OKLCH = useExactChip
		? { ...chipOKLCH }
		: {
				...colorOKLCH,
				l:
					themeType === 'light'
						? (baselineLValueLight ?? themeLightness)
						: (baselineLValueDark ?? themeLightness),
				c: chipOKLCH.c,
			};

	let { foreground: foregroundColorOKLCH, preferred } =
		pickAccentForegroundPair(
			normalizedColorOKLCH,
			themeType,
			foregroundLValueLight,
			foregroundLValueDark,
			foregroundMaxChroma,
			minContrast,
		);

	// If neither foreground meets the target, adjust the color's lightness
	// minimally until the preferred foreground meets the threshold.
	if (
		!useExactChip &&
		calculateContrast(normalizedColorOKLCH, foregroundColorOKLCH) <
			contrastTarget
	) {
		// Move the accent away from the foreground to increase contrast.
		const direction = preferred.l < normalizedColorOKLCH.l ? 1 : -1;
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

		normalizedColorOKLCH = {
			...normalizedColorOKLCH,
			l: (lo + hi) / 2,
		};
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
		// Strong = more contrast with surface, weak = less contrast with surface.
		// Light mode: strong darker (-1), weak lighter.
		// Dark mode: strong lighter (+1), weak darker.
		const contrastDirection = themeType === 'light' ? -1 : 1;

		// If DEFAULT is too close to the contrast boundary with the
		// foreground, shift it toward the surface so strong has room.
		let boundaryL = findContrastBoundaryLightness(
			normalizedColorOKLCH,
			foregroundColorOKLCH,
			contrastTarget,
		);
		let distToBoundary =
			boundaryL !== null ? Math.abs(normalizedColorOKLCH.l - boundaryL) : 0;

		if (!useExactChip && distToBoundary < VARIANT_DELTA) {
			const shift = Math.min(VARIANT_DELTA - distToBoundary, VARIANT_DELTA / 2);
			// Shift DEFAULT away from the foreground to open space for strong.
			const awayFromForeground =
				foregroundColorOKLCH.l < normalizedColorOKLCH.l ? 1 : -1;
			normalizedColorOKLCH = {
				...normalizedColorOKLCH,
				l: Math.max(
					0,
					Math.min(1, normalizedColorOKLCH.l + shift * awayFromForeground),
				),
			};

			// Recompute boundary after shifting DEFAULT.
			boundaryL = findContrastBoundaryLightness(
				normalizedColorOKLCH,
				foregroundColorOKLCH,
				contrastTarget,
			);
			distToBoundary =
				boundaryL !== null ? Math.abs(normalizedColorOKLCH.l - boundaryL) : 0;
		}

		const strongDelta = Math.min(VARIANT_DELTA, distToBoundary);

		// Weak moves away from foreground — clamp so it still meets
		// the minimum contrast with the foreground.
		const weakCandidate =
			normalizedColorOKLCH.l - VARIANT_DELTA * contrastDirection;
		const weakCandidateColor = { ...normalizedColorOKLCH, l: weakCandidate };
		const weakContrast = calculateContrast(
			weakCandidateColor,
			foregroundColorOKLCH,
		);
		let weakDelta = VARIANT_DELTA;
		if (weakContrast < contrastTarget) {
			// Binary search for the max safe delta in the weak direction.
			let lo = 0;
			let hi = VARIANT_DELTA;
			for (let i = 0; i < 20; i++) {
				const mid = (lo + hi) / 2;
				const testL = normalizedColorOKLCH.l - mid * contrastDirection;
				const testColor = { ...normalizedColorOKLCH, l: testL };
				if (
					calculateContrast(testColor, foregroundColorOKLCH) > contrastTarget
				) {
					lo = mid;
				} else {
					hi = mid;
				}
			}
			weakDelta = lo;
		}

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

	const skipSurfaceCap = baselineLValueLight !== undefined;

	if (rawHueShift !== 0) {
		const clamped = clampHueShift(rawHueShift, 2);
		strongColorOKLCH = {
			...strongColorOKLCH,
			h: wrapHue(strongColorOKLCH.h + clamped),
		};
		weakColorOKLCH = {
			...weakColorOKLCH,
			h: wrapHue(weakColorOKLCH.h - clamped),
		};

		// Gamut mapping at the new hue can shift luminance enough to break contrast.
		strongColorOKLCH = ensureContrast(
			strongColorOKLCH,
			foregroundColorOKLCH,
			contrastTarget,
		);
		weakColorOKLCH = ensureContrast(
			weakColorOKLCH,
			foregroundColorOKLCH,
			contrastTarget,
		);
	}

	normalizedColorOKLCH = constrainLightVariant(
		themeType,
		normalizedColorOKLCH,
		foregroundColorOKLCH,
		contrastTarget,
		skipSurfaceCap,
	);
	strongColorOKLCH = constrainLightVariant(
		themeType,
		strongColorOKLCH,
		foregroundColorOKLCH,
		contrastTarget,
		skipSurfaceCap,
	);
	weakColorOKLCH = constrainLightVariant(
		themeType,
		weakColorOKLCH,
		foregroundColorOKLCH,
		contrastTarget,
		skipSurfaceCap,
	);

	return {
		DEFAULT: { ...normalizedColorOKLCH },
		strong: { ...strongColorOKLCH },
		weak: { ...weakColorOKLCH },
		foreground: { ...foregroundColorOKLCH },
	};
}

let warnedLegacyLightness = false;

export function resolveThemeLightness(
	themeType: ThemeType,
	options?: Pick<HextimateStyleOptions, 'light' | 'dark' | 'inputLightness'>,
): number {
	const themeAdjustments =
		themeType === 'light' ? options?.light : options?.dark;
	const range =
		themeType === 'light'
			? LIGHT_THEME_LIGHTNESS_RANGE
			: DARK_THEME_LIGHTNESS_RANGE;

	const value = themeAdjustments?.baseLightness ?? themeAdjustments?.lightness;

	if (
		themeAdjustments?.baseLightness === undefined &&
		themeAdjustments?.lightness !== undefined &&
		!warnedLegacyLightness &&
		typeof console !== 'undefined'
	) {
		warnedLegacyLightness = true;
		console.warn(
			'[hextimator] `style({ light/dark: { lightness } })` is deprecated. ' +
				'Rename to `baseLightness` to disambiguate from the relative ' +
				'`lightness` offset used by `addToken({ from, lightness })`. ' +
				'Will be removed in a future release.',
		);
	}

	if (value !== undefined) {
		return Math.min(Math.max(value, range[0]), range[1]);
	}

	if (options?.inputLightness !== undefined) {
		return Math.min(Math.max(options.inputLightness, range[0]), range[1]);
	}

	return themeType === 'light'
		? DEFAULT_LIGHT_THEME_LIGHTNESS
		: DEFAULT_DARK_THEME_LIGHTNESS;
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

function ensureContrast(
	variant: OKLCH,
	foreground: OKLCH,
	target: number,
): OKLCH {
	if (calculateContrast(variant, foreground) >= target) return variant;

	const direction = foreground.l < variant.l ? 1 : -1;

	let lo = direction === 1 ? variant.l : 0;
	let hi = direction === 1 ? 1 : variant.l;

	for (let i = 0; i < 20; i++) {
		const mid = (lo + hi) / 2;
		const test = { ...variant, l: mid };
		if (calculateContrast(test, foreground) >= target) {
			if (direction === 1) hi = mid;
			else lo = mid;
		} else {
			if (direction === 1) lo = mid;
			else hi = mid;
		}
	}

	return { ...variant, l: (lo + hi) / 2 };
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
