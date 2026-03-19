import { convert } from "../convert";
import { Color } from "../types";
import { DEFAULT_THEME_LIGHTNESS, DEFAULT_THEME_LIGHTNESS_DARK_DELTA, DEFAULT_THEME_LIGHTNESS_LIGHT_DELTA } from "./consts";
import { ColorScale, GenerateOptions, ThemeType } from "./types";

const BASELINE_DARK_L_VALUE = 0.45;
const BASELINE_LIGHT_L_VALUE = 0.55;

const FOREGROUND_DARK_L_VALUE = 0.98;
const FOREGROUND_LIGHT_L_VALUE = 0.02;
const FOREGROUND_MAX_CHROMA = 0.05;

const STRONG_DELTA_DARK = 0.05;
const STRONG_DELTA_LIGHT = -0.05;
const WEAK_DELTA_DARK = -0.05;
const WEAK_DELTA_LIGHT = 0.05;

interface ExpandColorToScaleOptions extends Pick<GenerateOptions, 'themeLightness'> {
  lightDelta?: number;
  darkDelta?: number;
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
    baselineLValueDark,
    baselineLValueLight,
    themeLightness,
    foregroundLValueDark = FOREGROUND_DARK_L_VALUE,
    foregroundLValueLight = FOREGROUND_LIGHT_L_VALUE,
    foregroundMaxChroma = FOREGROUND_MAX_CHROMA,
    strongDeltaDark = STRONG_DELTA_DARK,
    strongDeltaLight = STRONG_DELTA_LIGHT,
    weakDeltaDark = WEAK_DELTA_DARK,
    weakDeltaLight = WEAK_DELTA_LIGHT,
  } = options ?? {};

  console.log({themeLightness})

  const { lightThemeLightnessValue, darkThemeLightnessValue } = generateLightnessPair(themeLightness, options);

  console.log({lightThemeLightnessValue, darkThemeLightnessValue})

  const colorOKLCH = convert(color, "oklch");
  const normalizedColorOKLCH = {
    ...colorOKLCH,
    l: themeType === "light" ? baselineLValueLight ?? lightThemeLightnessValue : baselineLValueDark ?? darkThemeLightnessValue,
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
    DEFAULT: convert(normalizedColorOKLCH, "srgb") ?? undefined,
    strong: convert(strongColorOKLCH, "srgb") ?? undefined,
    weak: convert(weakColorOKLCH, "srgb") ?? undefined,
    foreground: convert(foregroundColorOKLCH, "srgb") ?? undefined,
  };
}

/**
 * Based on the preferred lightness (of the theme)
 * Generates the lightness pair for dark and light theme
 * @param lightness number between 0 and 1
 */
export function generateLightnessPair(lightness?: number, options?: { darkDelta?: number; lightDelta?: number }) {
  const themeLightness = lightness ?? DEFAULT_THEME_LIGHTNESS;

  const lightDelta = options?.lightDelta ?? DEFAULT_THEME_LIGHTNESS_LIGHT_DELTA;
  const darkDelta = options?.darkDelta ?? DEFAULT_THEME_LIGHTNESS_DARK_DELTA;

  const lightThemeLightnessValue = Math.min(themeLightness + lightDelta, 1);
  const darkThemeLightnessValue = Math.min(themeLightness + darkDelta, 1);

  return {
    lightThemeLightnessValue,
    darkThemeLightnessValue
  }

}
