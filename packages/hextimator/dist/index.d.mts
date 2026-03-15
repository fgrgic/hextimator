interface RGB {
    readonly space: "srgb";
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly alpha: number;
}
interface HSL {
    readonly space: "hsl";
    readonly h: number;
    readonly s: number;
    readonly l: number;
    readonly alpha: number;
}
interface OKLCH {
    readonly space: "oklch";
    readonly l: number;
    readonly c: number;
    readonly h: number;
    readonly alpha: number;
}
interface OKLab {
    readonly space: "oklab";
    readonly l: number;
    readonly a: number;
    readonly b: number;
    readonly alpha: number;
}
interface Lab {
    readonly space: "lab";
    readonly l: number;
    readonly a: number;
    readonly b: number;
    readonly alpha: number;
}
interface LinearRGB {
    readonly space: "linear-rgb";
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly alpha: number;
}
interface P3 {
    readonly space: "p3";
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly alpha: number;
}
type Color = RGB | HSL | OKLCH | OKLab | Lab | LinearRGB | P3;
type ColorInSpace<S extends Color["space"]> = Extract<Color, {
    space: S;
}>;
type ColorSpace = Color["space"];
/**
 * "FF6666", "#FF6666", "0xFF6666", "#F66" with optional alpha
 */
type HexString = string;
/**
 * e.g. rgb(255, 102, 102), rgba(255, 102, 102, 0.5)
 */
type CSSColorString = string;
/** Loose tuple: [255, 102, 102], [255, 102, 102, 0.5] */
type ColorTuple = readonly [number, number, number, number?];
type ColorInput = HexString | CSSColorString | ColorTuple | Color | number;

/**
 * Convert a Color to a target color space.
 *
 * Supports all directed pairs among: srgb, linear-rgb, oklab, oklch, hsl.
 */
declare function convert<S extends ColorSpace>(color: Color, to: S): ColorInSpace<S>;

/**
 * Creates a palette from 1 base color, or more colors passed to it with additional options
 * @param color ColorInput
 * @returns
 */
declare function hextimate(color: ColorInput, options?: any): any | null;

export { convert, hextimate };
