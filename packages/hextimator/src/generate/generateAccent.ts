import { Color } from "../types";
import { ColorScale, ThemeType } from "./types";
import { expandColorToScale } from "./utils";

const ACCENT_DARK_L_VALUE = 0.4;
const ACCENT_LIGHT_L_VALUE = 0.6;

const FOREGROUND_DARK_L_VALUE = 0.98;
const FOREGROUND_LIGHT_L_VALUE = 0.1;

const STRONG_DELTA_DARK = -0.05;
const STRONG_DELTA_LIGHT = 0.05;
const WEAK_DELTA_DARK = 0.05;
const WEAK_DELTA_LIGHT = -0.05;

export function generateAccent(
  accent: Color,
  themeType: ThemeType,
): ColorScale | null {
  return expandColorToScale(accent, themeType, {
    baselineLValueDark: ACCENT_DARK_L_VALUE,
    baselineLValueLight: ACCENT_LIGHT_L_VALUE,
    foregroundLValueDark: FOREGROUND_DARK_L_VALUE,
    foregroundLValueLight: FOREGROUND_LIGHT_L_VALUE,
    strongDeltaDark: STRONG_DELTA_DARK,
    strongDeltaLight: STRONG_DELTA_LIGHT,
    weakDeltaDark: WEAK_DELTA_DARK,
    weakDeltaLight: WEAK_DELTA_LIGHT,
  });
}
