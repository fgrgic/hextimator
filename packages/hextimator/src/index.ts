import type { FormatResult } from "./format";
import { format } from "./format";
import { generate } from "./generate";
import { parse } from "./parse";
import type { ColorInput, HextimateOptions } from "./types";

export { convert as convertColor } from "./convert";
export type { FlatTokenMap, FormatResult, NestedTokenMap } from "./format";
export { parse as parseColor } from "./parse";
export { HextimateOptions } from "./types";

export interface HextimateResult {
  light: FormatResult;
  dark: FormatResult;
}

/**
 * Creates a palette from 1 base color, or more colors passed to it with additional options
 * @param color ColorInput
 * @param options HextimateOptions
 */
export function hextimate(
  color: ColorInput,
  options?: HextimateOptions,
): HextimateResult | null {
  const parsedColor = parse(color);
  if (!parsedColor) return null;

  const lightPalette = generate(parsedColor, "light", options);
  const darkPalette = generate(parsedColor, "dark", options);

  if (!lightPalette || !darkPalette) return null;

  return {
    light: format(lightPalette, options),
    dark: format(darkPalette, options),
  };
}
