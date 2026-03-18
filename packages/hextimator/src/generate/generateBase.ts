import { parse } from "../parse";
import { Color } from "../types";
import { ColorScale, GenerateOptions, ThemeType } from "./types";
import { expandColorToScale } from "./utils";

const DEFAULT_BASE_DARK_COLOR = "#1a1a1a";
const DEFAULT_BASE_LIGHT_COLOR = "#fafafa";

const BASELINE_DARK_L_VALUE = 0.1;
const BASELINE_LIGHT_L_VALUE = 0.95;

const FOREGROUND_DARK_L_VALUE = 0.98;
const FOREGROUND_LIGHT_L_VALUE = 0.1;

const STRONG_DELTA_DARK = -0.05;
const STRONG_DELTA_LIGHT = 0.05;
const WEAK_DELTA_DARK = 0.05;
const WEAK_DELTA_LIGHT = -0.05;

export function generateBase(
  color: Color,
  themeType: ThemeType,
  options?: GenerateOptions,
): ColorScale | null {
  const preferredBaseColorInput =
    themeType === "light"
      ? (options?.preferredBaseColors?.light ?? DEFAULT_BASE_LIGHT_COLOR)
      : (options?.preferredBaseColors?.dark ?? DEFAULT_BASE_DARK_COLOR);

  const preferredBaseColor = parse(preferredBaseColorInput);
  if (!preferredBaseColor) return null;

  return expandColorToScale(preferredBaseColor, themeType, {
    baselineLValueDark: BASELINE_DARK_L_VALUE,
    baselineLValueLight: BASELINE_LIGHT_L_VALUE,
    foregroundLValueDark: FOREGROUND_DARK_L_VALUE,
    foregroundLValueLight: FOREGROUND_LIGHT_L_VALUE,
    strongDeltaDark: STRONG_DELTA_DARK,
    strongDeltaLight: STRONG_DELTA_LIGHT,
    weakDeltaDark: WEAK_DELTA_DARK,
    weakDeltaLight: WEAK_DELTA_LIGHT,
  });
}
