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
 * Modifiers to the generation process. Used by {@link HextimateStyleOptions} for
 * global or per-theme (dark/light) settings
 */
export interface ThemeAdjustments {
	/**
	 * Absolute OKLCH lightness anchor for accent fills (0–1). Distinct from
	 * the relative `lightness` offsets used by `addToken({ from, lightness })`.
	 *
	 * If omitted, seed from the brand color's OKLCH **L**, clamped via
	 * `baseLightnessRange` (per theme object, then top-level, then built-ins:
	 * light `[0.4, 0.9]`, dark `[0.2, 0.8]`).
	 */
	baseLightness?: number;

	/**
	 * @deprecated Renamed to `baseLightness` in 0.7.0 to disambiguate it from
	 * the relative `lightness` offset used by `addToken({ from, lightness })`.
	 * Still works as a fallback. Will be removed in a future release.
	 */
	lightness?: number;

	/**
	 * Max chroma for accent and semantic fills in scope. Higher chroma is clamped.
	 */
	maxChroma?: number;

	/**
	 * OKLCH **L** bounds `[min, max]` (0–1) for `baseLightness` and input-derived anchors.
	 * Top-level: use one tuple for both themes unless `light` / `dark` set their own.
	 */
	baseLightnessRange?: readonly [number, number];

	/**
	 * Minimum contrast between non-foreground variants and foreground.
	 * `"AAA"` → 7, `"AA"` → 4.5, or a number.
	 */
	minContrastRatio?: 'AAA' | 'AA' | number;

	/**
	 * Max chroma for surface (`surface`, `strong`, `weak`). Default `0.01`.
	 */
	surfaceMaxChroma?: number;

	/**
	 * Max chroma for foreground variants (e.g. `accent-foreground`). Default `0.01`.
	 */
	foregroundMaxChroma?: number;

	/**
	 * Surface baseline. Top-level: both themes unless `light.surfaceColor` / `dark.surfaceColor`.
	 * Omitted: derived from the brand color with low chroma.
	 */
	surfaceColor?: ColorInput;

	/**
	 * Rotate surface hue vs accent (degrees). Ignored when `surfaceColor` is set for that scope.
	 */
	surfaceHueShift?: number;

	/**
	 * Per-variant hue shift on accent and semantic scales. Strong-side shifts toward higher hue,
	 * weak-side toward lower; each step stacks. Clamped to `360 / (totalVariants + 1)`.
	 */
	hueShift?: number;

	/** Semantic role overrides; nested maps merge per slot with the top-level map. */
	semanticColors?: {
		positive?: ColorInput;
		negative?: ColorInput;
		caution?: ColorInput;
	};

	/**
	 * OKLCH hue arcs for semantic discovery. Defaults: positive [120,160], negative [5,30], caution [45,70].
	 */
	semanticColorRanges?: {
		positive?: [number, number];
		negative?: [number, number];
		caution?: [number, number];
	};
}

/**
 * Options that control how the palette is generated from the input color.
 *
 * Inherits {@link ThemeAdjustments} as global defaults; set `light` / `dark`
 * to override per theme.
 */
export interface HextimateStyleOptions extends ThemeAdjustments {
	/**
	 * In dark mode: surface hue becomes accent and accent hue becomes surface.
	 * Requires a `surfaceColor` on the invert path (top-level or `dark`).
	 */
	invertDarkModeSurfaceAccent?: boolean;

	light?: ThemeAdjustments;
	dark?: ThemeAdjustments;
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
	 * - surface: "bg"
	 * - accent: "button"
	 * - positive: "success"
	 * - negative: "error"
	 * - caution: "caution"
	 *
	 * If not provided, the default role names will be used.
	 * The default role names are:
	 * - surface: "surface"
	 * - accent: "accent"
	 * - positive: "positive"
	 * - negative: "negative"
	 * - caution: "caution"
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
	 * Use "_" for "surface_strong", "/" for "surface/strong", etc.
	 */
	separator?: string;

	/**
	 * String prepended to every flat token key in `as: "object"` and `as: "json"`.
	 * Use `"--"` for CSS custom property names (`"--surface"`, `"--accent-strong"`).
	 *
	 * Ignored for `scss` (`$` prefix), nested `tailwind`, and stylesheet outputs
	 * (`css`, `tailwind-css` already declare variables with `--`).
	 *
	 * Default: `""` (no prefix).
	 */
	keyPrefix?: string;

	/**
	 * Output format.
	 * - "object" (default): { surface: "#f2eee8", "surface-strong": "#d4cfc8", ...} or with keyPrefix "--": { "--surface": "...", "--surface-strong": "..." }
	 * - "css": ready-to-paste CSS stylesheet string with `:root {}` and a dark-mode wrapper
	 * - "tailwind": { surface: { DEFAULT: "#f2eee8", strong: "#d4cfc8", weak: "#faf8f6" } }
	 * - "scss": { $surface: "#f2eee8", $surface-strong: "#d4cfc8", ...}
	 * - "json": '{ "surface": "#f2eee8", "surface-strong": "#d4cfc8", ...}'
	 * - "tailwind-css": Tailwind v4 stylesheet string with a single `@theme { ... }` block and dark-mode overrides
	 *
	 * Stylesheet outputs (`css`, `tailwind-css`) combine light + dark into one
	 * string. Use `darkMode` to pick the strategy and `selector` (for `css`) to
	 * change the root selector.
	 */
	as?: 'object' | 'css' | 'tailwind' | 'tailwind-css' | 'scss' | 'json';

	/**
	 * Dark-mode strategy for stylesheet outputs (`as: 'css'`, `as: 'tailwind-css'`).
	 * Ignored for every other output format.
	 *
	 * - `'media'` (default): wraps dark tokens in `@media (prefers-color-scheme: dark)`
	 * - `'class'`: dark tokens apply under `.dark` (and descendants)
	 * - `'data-attribute'`: dark tokens apply under `[data-theme="dark"]`
	 * - `false`: omit dark tokens entirely (light-only output)
	 */
	darkMode?: 'media' | 'class' | 'data-attribute' | false;

	/**
	 * Selector for the root rule in `as: 'css'` output. Default: `':root'`.
	 *
	 * Ignored for `as: 'tailwind-css'` (Tailwind v4's `@theme` is always root-scoped).
	 */
	selector?: string;

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

	/**
	 * Role keys to omit from the output entirely.
	 * Uses the internal role name (before any `roleNames` remapping).
	 *
	 * Example: `['caution']` removes the caution scale from the output.
	 */
	excludeRoles?: string[];

	/**
	 * Variant keys to omit from every role's output.
	 * Uses the internal variant name (before any `variantNames` remapping).
	 *
	 * Example: `['strong', 'weak']` removes those variants from all roles.
	 */
	excludeVariants?: string[];

	/**
	 * Emit an extra `-inverted` copy of every token whose value is the
	 * opposite mode's value (light tokens get dark values, dark tokens get
	 * light values). Inverted tokens flip with the active mode, just like
	 * regular tokens.
	 *
	 * Use for sections that intentionally contrast with the surrounding
	 * theme: testimonials, alternating stripes, hero callouts, "spotlight"
	 * panels. One class (`bg-surface-inverted`) flips both ways.
	 *
	 * For "always this mode" sections, compose with the dark-mode variant:
	 * - Always dark: `bg-surface-inverted dark:bg-surface`
	 * - Always light: `bg-surface dark:bg-surface-inverted`
	 *
	 * Example output (flat keys):
	 * - `accent-inverted`, `accent-strong-inverted`, `accent-foreground-inverted`
	 *
	 * Tailwind users need to pair this with the companion stylesheet:
	 * `@import "hextimator/tailwind-inverted.css";` to get utilities like
	 * `bg-accent-inverted`, `text-accent-foreground-inverted`.
	 *
	 * Default: `false`.
	 */
	invertedVariants?: boolean;
}

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
