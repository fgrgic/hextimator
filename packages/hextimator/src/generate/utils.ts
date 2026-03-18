import { convert } from "../convert";
import { Color } from "../types";
import { ColorScale, ThemeType } from "./types";

const BASELINE_DARK_L_VALUE = 0.45;
const BASELINE_LIGHT_L_VALUE = 0.55;

const FOREGROUND_DARK_L_VALUE = 0.98;
const FOREGROUND_LIGHT_L_VALUE = 0.02;
const FOREGROUND_MAX_CHROMA = 0.05;

const STRONG_DELTA_DARK = 0.05;
const STRONG_DELTA_LIGHT = -0.05;
const WEAK_DELTA_DARK = -0.05;
const WEAK_DELTA_LIGHT = 0.05;

interface ExpandColorToScaleOptions {
  baselineLValueDark?: number;
  baselineLValueLight?: number;
  foregroundLValueDark?: number;
  foregroundLValueLight?: number;
  foregroundMaxChroma?: number;
  strongDeltaDark?: number;
  strongDeltaLight?: number;
  weakDeltaDark?: number;
  weakDeltaLight?: number;
}

export function expandColorToScale(
  color: Color,
  themeType: ThemeType,
  options?: ExpandColorToScaleOptions,
): ColorScale {
  const {
    baselineLValueDark = BASELINE_DARK_L_VALUE,
    baselineLValueLight = BASELINE_LIGHT_L_VALUE,
    foregroundLValueDark = FOREGROUND_DARK_L_VALUE,
    foregroundLValueLight = FOREGROUND_LIGHT_L_VALUE,
    foregroundMaxChroma = FOREGROUND_MAX_CHROMA,
    strongDeltaDark = STRONG_DELTA_DARK,
    strongDeltaLight = STRONG_DELTA_LIGHT,
    weakDeltaDark = WEAK_DELTA_DARK,
    weakDeltaLight = WEAK_DELTA_LIGHT,
  } = options ?? {};

  const colorOKLCH = convert(color, "oklch");
  const normalizedColorOKLCH = {
    ...colorOKLCH,
    l: themeType === "light" ? baselineLValueLight : baselineLValueDark,
  };

  const strongColorOKLCH = {
    ...normalizedColorOKLCH,
    l:
      normalizedColorOKLCH.l +
      (themeType === "light" ? strongDeltaLight : strongDeltaDark),
  };

  const weakColorOKLCH = {
    ...normalizedColorOKLCH,
    l:
      normalizedColorOKLCH.l +
      (themeType === "light" ? weakDeltaLight : weakDeltaDark),
  };

  const foregroundColorOKLCH = {
    ...normalizedColorOKLCH,
    l: themeType === "light" ? foregroundLValueLight : foregroundLValueDark,
    c: Math.min(normalizedColorOKLCH.c, foregroundMaxChroma),
  };

  return {
    DEFAULT: convert(colorOKLCH, "srgb") ?? undefined,
    strong: convert(strongColorOKLCH, "srgb") ?? undefined,
    weak: convert(weakColorOKLCH, "srgb") ?? undefined,
    foreground: convert(foregroundColorOKLCH, "srgb") ?? undefined,
  };
}
