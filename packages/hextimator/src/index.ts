import { Color, ColorInput } from "./types";
import { parseColor } from "./utils";

/**
 * Creates a palette from 1 base color, or more colors passed to it with additional options
 * @param color ColorInput
 * @returns
 */
export function hextimate(color: ColorInput, options?: any): Color | null {
  const parsedColor = parseColor(color);
  if (!parsedColor) return null;

  // TODO: const palette = generatePalette(parsedColor);
  return parsedColor;
}
