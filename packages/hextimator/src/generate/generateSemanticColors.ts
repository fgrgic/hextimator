import { convert } from "../convert";
import { parse } from "../parse";
import { Color } from "../types";
import { GenerateOptions, HextimatePalette, ThemeType } from "./types";
import { expandColorToScale } from "./utils";

const POSITIVE_RANGE: [number, number] = [135, 160];
const NEGATIVE_RANGE: [number, number] = [5, 25];
const WARNING_RANGE: [number, number] = [45, 65];

export function generateSemanticColors(
  color: Color,
  themeType: ThemeType,
  options?: GenerateOptions,
): Pick<HextimatePalette, "positive" | "negative" | "warning"> | null {
  const positiveBaseColor = parse(
    options?.semanticColors?.positive ??
      _determineBaseColorFromRange(
        color,
        options?.semanticColorRanges?.positive ?? POSITIVE_RANGE,
        themeType,
      ),
  );
  if (!positiveBaseColor) return null;

  const negativeBaseColor = parse(
    options?.semanticColors?.negative ??
      _determineBaseColorFromRange(
        color,
        options?.semanticColorRanges?.negative ?? NEGATIVE_RANGE,
        themeType,
      ),
  );
  if (!negativeBaseColor) return null;

  const warningBaseColor = parse(
    options?.semanticColors?.warning ??
      _determineBaseColorFromRange(
        color,
        options?.semanticColorRanges?.warning ?? WARNING_RANGE,
        themeType,
      ),
  );
  if (!warningBaseColor) return null;

  const positiveColorScale = expandColorToScale(positiveBaseColor, themeType, {themeLightness: options?.themeLightness});
  const negativeColorScale = expandColorToScale(negativeBaseColor, themeType, {themeLightness: options?.themeLightness});
  const warningColorScale = expandColorToScale(warningBaseColor, themeType, {themeLightness: options?.themeLightness});

  return {
    positive: positiveColorScale,
    negative: negativeColorScale,
    warning: warningColorScale,
  };
}

const BASE_DARK_L_VALUE = 0.45;
const BASE_LIGHT_L_VALUE = 0.55;

function _determineBaseColorFromRange(
  color: Color,
  range: [number, number],
  themeType: ThemeType,
): Color {
  const baseLValue =
    themeType === "light" ? BASE_LIGHT_L_VALUE : BASE_DARK_L_VALUE;
  const complementaryColor = _getComplementaryColor(color);
  const splitComplementaryColors =
    _getSplitComplementaryColors(complementaryColor);

  const targetColors = [complementaryColor, ...splitComplementaryColors];

  // check if any of the target colors are in the range
  // if so return the target color with the base L value
  for (const targetColor of targetColors) {
    const h = convert(targetColor, "oklch").h;

    const inRange =
      range[0] <= range[1]
        ? h >= range[0] && h <= range[1]
        : h >= range[0] || h <= range[1];

    if (inRange) {
      return convert({ ...convert(color, "oklch"), l: baseLValue, h }, "oklch");
    }
  }

  const candidate1 = convert(
    { ...convert(color, "oklch"), l: baseLValue, h: range[0] },
    "oklch",
  );
  const candidate2 = convert(
    { ...convert(color, "oklch"), l: baseLValue, h: range[1] },
    "oklch",
  );

  const dist1 = Math.min(
    ...targetColors.map((t) => _hueDistance(range[0], convert(t, "oklch").h)),
  );
  const dist2 = Math.min(
    ...targetColors.map((t) => _hueDistance(range[1], convert(t, "oklch").h)),
  );

  return dist1 < dist2 ? candidate1 : candidate2;
}

function _hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 360 - diff);
}

function _getComplementaryColor(color: Color): Color {
  const colorOKLCH = convert(color, "oklch");

  return convert({ ...colorOKLCH, h: (colorOKLCH.h + 180) % 360 }, "srgb");
}

function _getSplitComplementaryColors(color: Color): [Color, Color] {
  const colorOKLCH = convert(color, "oklch");

  return [
    convert({ ...colorOKLCH, h: (colorOKLCH.h + 150) % 360 }, "srgb"),
    convert({ ...colorOKLCH, h: (colorOKLCH.h + 210) % 360 }, "srgb"),
  ];
}
