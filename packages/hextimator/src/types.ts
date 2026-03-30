/** A color in the sRGB color space. */
export interface RGB {
	readonly space: 'srgb';
	readonly r: number; // 0-255
	readonly g: number; // 0-255
	readonly b: number; // 0-255
	readonly alpha: number; // 0-1
}

/** A color in the HSL color space. */
export interface HSL {
	readonly space: 'hsl';
	readonly h: number; // 0-360
	readonly s: number; // 0-100
	readonly l: number; // 0-100
	readonly alpha: number;
}

/** A color in the OKLCH color space. */
export interface OKLCH {
	readonly space: 'oklch';
	readonly l: number; // 0-1
	readonly c: number; // 0-~0.4
	readonly h: number; // 0-360
	readonly alpha: number;
}

/** A color in the OKLab color space. */
export interface OKLab {
	readonly space: 'oklab';
	readonly l: number; // 0-1
	readonly a: number; // cca -0.4 - 0.4
	readonly b: number;
	readonly alpha: number;
}

/** A color in the linear RGB color space. */
export interface LinearRGB {
	readonly space: 'linear-rgb';
	readonly r: number; // 0-1
	readonly g: number; // 0-1
	readonly b: number; // 0-1
	readonly alpha: number;
}

/** A color in the Display P3 color space (wide gamut). */
export interface DisplayP3 {
	readonly space: 'display-p3';
	readonly r: number; // 0-1
	readonly g: number; // 0-1
	readonly b: number; // 0-1
	readonly alpha: number;
}

/** A color in any supported color space. */
export type Color = RGB | HSL | OKLCH | OKLab | LinearRGB | DisplayP3;

/** A color in a specific color space, strongly typed. */
export type ColorInSpace<S extends Color['space']> = Extract<
	Color,
	{ space: S }
>;

/** The name of a color space, e.g. "srgb", "hsl", "oklch". */
export type ColorSpace = Color['space'];

/** "FF6666", "#FF6666", "0xFF6666", "#F66" with optional alpha. */
export type HexString = string;

/** e.g. `rgb(255, 102, 102)`, `rgba(255, 102, 102, 0.5)`. */
export type CSSColorString = string;

/** Loose tuple: [255, 102, 102], [255, 102, 102, 0.5] */
export type ColorTuple = readonly [number, number, number, number?];

/**
 * Any supported color input: hex string, CSS function string, RGB tuple, numeric hex, or a parsed `Color` object.
 *
 * @example
 * "#FF6666"
 * "rgb(255, 102, 102)"
 * [255, 102, 102]
 * 0xFF6666
 */
export type ColorInput =
	| HexString
	| CSSColorString
	| ColorTuple
	| Color // pass through
	| number; // e.g. 0xFF6666

// function signatures

/**
 * Any input → Color
 * You can optionally pick color space for ambiguous inputs
 */
export type ParseColor = (input: ColorInput, assumeSpace?: ColorSpace) => Color;

/**
 * Color → a specific color space, strongly typed
 */
export type ConvertColor = <S extends ColorSpace>(
	color: Color,
	to: S,
) => ColorInSpace<S>;

/**
 * Per-theme adjustments for lightness and chroma.
 */
export interface ThemeAdjustments {
	/**
	 * Absolute OKLCH lightness for this theme (0–1).
	 *
	 * Default: 0.7 for light, 0.6 for dark.
	 */
	lightness?: number;

	/**
	 * Maximum chroma for accent/semantic colors in this theme.
	 * Colors with higher chroma will be clamped to this value.
	 */
	maxChroma?: number;

	/**
	 * Minimum WCAG contrast ratio for this theme.
	 * Overrides the global `minContrastRatio` for this theme only.
	 *
	 * - `"AAA"` → 7
	 * - `"AA"` → 4.5
	 * - any number → exact ratio
	 */
	minContrastRatio?: 'AAA' | 'AA' | number;

	/**
	 * Maximum chroma for the baseline colors (base, strong, weak) in this theme.
	 * Overrides the global `baseMaxChroma` for this theme only.
	 */
	baseMaxChroma?: number;

	/**
	 * Maximum chroma for foreground colors in this theme.
	 * Overrides the global `foregroundMaxChroma` for this theme only.
	 */
	foregroundMaxChroma?: number;
}

/**
 * Options that affect color generation (the math)
 */
export interface HextimateGenerationOptions {
	/**
	 * Preferred base color for dark and light mode.
	 * It will be used as a baseline to generate the rest of base colors (strong, weak).
	 * If not provided, it will be derived from the main input color with very low chroma.
	 *
	 * Takes precedence over `baseHueShift` when both are set.
	 */
	baseColor?: ColorInput;

	/**
	 * Rotate the base color's hue relative to the accent color (in degrees).
	 *
	 * Examples: 180 for complementary, 30 for analogous, -30 for the other direction.
	 *
	 * Ignored when an explicit `baseColor` is provided.
	 *
	 * Default: 0 (same hue as the accent).
	 */
	baseHueShift?: number;

	/**
	 * Semantic colors to use for the theme
	 * If not provided, they will be generated from the provided main color,
	 * and the semantic color ranges.
	 */
	semanticColors?: {
		positive?: ColorInput;
		negative?: ColorInput;
		warning?: ColorInput;
	};

	/**
	 * Invert the hue used for the accent color in dark mode.
	 * Uses base hue as accent, and accent hue as base.
	 * Only has effect if `baseColor` is provided alongside the main accent color
	 *
	 * Default: false.
	 */
	invertDarkModeBaseAccent?: boolean;

	/**
	 * Degree ranges for the semantic colors.
	 * Determines where to look for "green", "red", "yellow" in the color space.
	 * If not provided, the default ranges will be used:
	 * - positive: [90, 150]   greens
	 * - negative: [345, 15]   reds
	 * - warning: [35, 55]    ambers
	 */
	semanticColorRanges?: {
		positive?: [number, number]; // [start, end]
		negative?: [number, number]; // [start, end]
		warning?: [number, number]; // [start, end]
	};

	/**
	 * Maximum chroma for the baseline colors (base, strong, weak).
	 * Higher values will produce more colorful baseline colors, lower values will produce more gray baseline colors.
	 *
	 * Default: 0.01.
	 */
	baseMaxChroma?: number;

	/**
	 * Maximum chroma for all the foreground colors (e.g. base-accent-foreground)
	 * Higher values will produce more colorful foreground colors, lower values will produce more gray foreground colors.
	 *
	 * Default: 0.01.
	 */
	foregroundMaxChroma?: number;

	/**
	 * Per-theme adjustments for the light theme.
	 */
	light?: ThemeAdjustments;

	/**
	 * Per-theme adjustments for the dark theme.
	 */
	dark?: ThemeAdjustments;

	/**
	 * Minimum WCAG contrast ratio between non-foreground variants and the
	 * foreground variant.
	 *
	 * - `"AAA"` (default) → 7
	 * - `"AA"` → 4.5
	 * - any number → exact ratio (e.g. 3 for large text)
	 */
	minContrastRatio?: 'AAA' | 'AA' | number;

	/**
	 * Shift the hue (in degrees) from variant to variant.
	 *
	 * - Positive value: strong-side variants shift toward higher hues,
	 *   weak-side variants shift toward lower hues.
	 * - Negative value: flips the direction.
	 * - Each successive variant on a side shifts by an additional step
	 *   (e.g. hueShift: 5 → strong +5°, stronger +10°, weak −5°, weaker −10°).
	 *
	 * Clamped to `360 / (totalVariants + 1)` so the palette never wraps
	 * past a full rotation.
	 *
	 * Default: 0 (no hue shift).
	 */
	hueShift?: number;
}

/**
 * Options that affect output formatting (serialization)
 */
export interface HextimateFormatOptions {
	/**
	 * Rename roles in the output token keys.
	 * Internal name → your custom name.
	 *
	 * Examples:
	 * - base: "bg"
	 * - accent: "button"
	 * - positive: "success"
	 * - negative: "error"
	 * - warning: "warning"
	 *
	 * If not provided, the default role names will be used.
	 * The default role names are:
	 * - base: "base"
	 * - accent: "accent"
	 * - positive: "positive"
	 * - negative: "negative"
	 * - warning: "warning"
	 */
	roleNames?: Record<string, string>;

	/**
	 * Rename variant suffixes in the output token keys.
	 * Internal name → your custom name.
	 *
	 * Examples:
	 * - DEFAULT: "secondary"
	 * - strong: "primary"
	 * - weak: "tertiary"
	 * - foreground: "text"
	 */
	variantNames?: Record<string, string>;

	/**
	 * Separator to use between the role and the variant in the output token keys.
	 * If not provided, the default separator will be used.
	 * The default separator is: "-"
	 *
	 * Use "_" for "base_strong", "/" for "base/strong", etc.
	 */
	separator?: string;

	/**
	 * Output format.
	 * - "object" (default): { base: "#f2eee8", "base-strong": "#d4cfc8", ...}
	 * - "css": { "--base": "#f2eee8", "--base-strong": "#d4cfc8", ...}
	 * - "tailwind": { base: { DEFAULT: "#f2eee8", strong: "#d4cfc8", weak: "#faf8f6" } }
	 * - "scss": { $base: "#f2eee8", $base-strong: "#d4cfc8", ...}
	 * - "json": '{ "base": "#f2eee8", "base-strong": "#d4cfc8", ...}'
	 * - "tailwind-css": '@theme { --color-base: #f2eee8; --color-base-strong: #d4cfc8; ... }'
	 */
	as?: 'object' | 'css' | 'tailwind' | 'tailwind-css' | 'scss' | 'json';

	/**
	 * How color values are serialized in the output.
	 *
	 * - "hex" (default) → "#f2eee8"
	 * - "hsl"           → "hsl(30, 10%, 94%)"
	 * - "hsl-raw"       → "30 10% 94%"            (shadcn / CSS variable style)
	 * - "oklch"         → "oklch(0.96 0.01 70)"
	 * - "oklch-raw"     → "0.96 0.01 70"
	 * - "p3"            → "color(display-p3 0.94 0.93 0.91)"  (wide gamut)
	 * - "p3-raw"        → "0.94 0.93 0.91"
	 * - "rgb"           → "rgb(242, 238, 232)"
	 * - "rgb-raw"       → "242 238 232"
	 */
	colors?: ColorFormat;
}

/**
 * Combined options for the convenience API.
 * Allows passing both generation and format options in one call.
 */
export type HextimateOptions = HextimateGenerationOptions &
	HextimateFormatOptions;

/** How color values are serialized in the output (e.g. "hex", "rgb", "oklch", "hsl", "p3", and their "-raw" variants). */
export type ColorFormat =
	| 'hex'
	| 'hsl'
	| 'hsl-raw'
	| 'oklch'
	| 'oklch-raw'
	| 'p3'
	| 'p3-raw'
	| 'rgb'
	| 'rgb-raw';
