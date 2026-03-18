import { generate } from "./generate";
import { parse } from "./parse";
import { ColorInput, HextimateOptions } from "./types";

export { convert as convertColor } from "./convert";
export { parse as parseColor } from "./parse";
export { HextimateOptions } from "./types";

/**
 * Creates a palette from 1 base color, or more colors passed to it with additional options
 * @param color ColorInput
 * @param options HextimateOptions
 * @returns
 */
export function hextimate(
  color: ColorInput,
  options?: HextimateOptions,
): any | null {
  const parsedColor = parse(color);
  if (!parsedColor) return null;

  const lightPalette = generate(parsedColor, "light", options);
  const darkPalette = generate(parsedColor, "dark", options);

  if (!lightPalette || !darkPalette) return null;

  // TODO: format the palettes
  // const formattedLight = format(lightPalette, options);
  // if (!formattedLight) return null;

  // const formattedDark = format(darkPalette, options);
  // if (!formattedDark) return null;

  return {
    light: lightPalette,
    dark: darkPalette,
  };
}
