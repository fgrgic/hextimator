import { convert } from "./convert";
import { ColorInput } from "./types";
import { parseColor } from "./utils";

export { convert } from "./convert";

/**
 * Creates a palette from 1 base color, or more colors passed to it with additional options
 * @param color ColorInput
 * @returns
 */
export function hextimate(color: ColorInput, options?: any): any | null {
  const parsedColor = parseColor(color);
  if (!parsedColor) return null;

  const oklch = convert(parsedColor, "oklch");

  // TODO: const palette = generatePalette(parsedColor);
  return {
    parsedColor,
    oklch,
  };
}
