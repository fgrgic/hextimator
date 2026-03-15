import { convert } from "./convert";
import { parse } from "./parse";
import { ColorInput } from "./types";

export { convert as convertColor } from "./convert";
export { parse as parseColor } from "./parse";

/**
 * Creates a palette from 1 base color, or more colors passed to it with additional options
 * @param color ColorInput
 * @returns
 */
export function hextimate(color: ColorInput, options?: any): any | null {
  const parsedColor = parse(color);
  if (!parsedColor) return null;

  const oklch = convert(parsedColor, "oklch");

  // TODO: const palette = generatePalette(parsedColor);
  return {
    parsedColor,
    oklch,
  };
}
