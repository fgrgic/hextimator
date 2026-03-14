// types per color space

export interface RGB {
  readonly space: "srgb";
  readonly r: number; // 0-255
  readonly g: number; // 0-255
  readonly b: number; // 0-255
  readonly alpha: number; // 0-1
}

export interface HSL {
  readonly space: "hsl";
  readonly h: number; // 0-360
  readonly s: number; // 0-100
  readonly l: number; // 0-100
  readonly alpha: number;
}

export interface OKLCH {
  readonly space: "oklch";
  readonly l: number; // 0-1
  readonly c: number; // 0-~0.4
  readonly h: number; // 0-360
  readonly alpha: number;
}

export interface OKLab {
  readonly space: "oklab";
  readonly l: number; // 0-1
  readonly a: number; // cca -0.4 - 0.4
  readonly b: number;
  readonly alpha: number;
}

export interface Lab {
  readonly space: "lab";
  readonly l: number; // 0-100
  readonly a: number; // -128-127
  readonly b: number; // -128-127
  readonly alpha: number;
}

export interface LinearRGB {
  readonly space: "linear-rgb";
  readonly r: number; // 0-1
  readonly g: number; // 0-1
  readonly b: number; // 0-1
  readonly alpha: number;
}

export interface P3 {
  readonly space: "p3";
  readonly r: number; // 0-1
  readonly g: number; // 0-1
  readonly b: number; // 0-1
  readonly alpha: number;
}

export type Color = RGB | HSL | OKLCH | OKLab | Lab | LinearRGB | P3;

export type ColorInSpace<S extends Color["space"]> = Extract<
  Color,
  { space: S }
>;
export type ColorSpace = Color["space"];

// input

/**
 * "FF6666", "#FF6666", "0xFF6666", "#F66" with optional alpha
 */
export type HexString = string;

/**
 * e.g. rgb(255, 102, 102), rgba(255, 102, 102, 0.5)
 */
export type CSSColorString = string;

/** Loose tuple: [255, 102, 102], [255, 102, 102, 0.5] */
export type ColorTuple = readonly [number, number, number, number?];

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
 * Parse and convert color
 * Optional. Let's see if we need something like that!
 */
// type ResolveColor = <S extends ColorSpace>(
//   input: ColorInput,
//   to: S,
//   assumeSpace?: ColorSpace,
// ) => ColorInSpace<S>;
