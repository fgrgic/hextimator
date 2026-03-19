import { convert } from "../convert";
import { Color } from "../types";
import { DEFAULT_THEME_LIGHTNESS } from "./consts";
import { ColorScale, GenerateOptions, ThemeType } from "./types";
import { expandColorToScale, generateLightnessPair } from "./utils";


export function generateAccent(
  accent: Color,
  themeType: ThemeType,
  options?: GenerateOptions
): ColorScale | null {
  return expandColorToScale(accent, themeType, options);
}
