import { convert } from "../convert";
import { parse } from "../parse";
import { Color } from "../types";
import { GenerateOptions, HextimatePalette, ThemeType } from "./types";
import { expandColorToScale } from "./utils";

const POSITIVE_RANGE: [number, number] = [90, 150];
const NEGATIVE_RANGE: [number, number] = [345, 15];
const WARNING_RANGE: [number, number] = [35, 55];

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
      ),
  );
  if (!positiveBaseColor) return null;

  console.log("positiveBaseColor", positiveBaseColor);

  const negativeBaseColor = parse(
    options?.semanticColors?.negative ??
      _determineBaseColorFromRange(
        color,
        options?.semanticColorRanges?.negative ?? NEGATIVE_RANGE,
      ),
  );
  if (!negativeBaseColor) return null;

  console.log("negativeBaseColor", negativeBaseColor);

  const warningBaseColor = parse(
    options?.semanticColors?.warning ??
      _determineBaseColorFromRange(
        color,
        options?.semanticColorRanges?.warning ?? WARNING_RANGE,
      ),
  );
  if (!warningBaseColor) return null;

  const positiveColorScale = expandColorToScale(positiveBaseColor, themeType);
  const negativeColorScale = expandColorToScale(negativeBaseColor, themeType);
  const warningColorScale = expandColorToScale(warningBaseColor, themeType);

  console.log("warningBaseColor", warningBaseColor);

  return {
    positive: positiveColorScale,
    negative: negativeColorScale,
    warning: warningColorScale,
  };
}

function _determineBaseColorFromRange(
  color: Color,
  range: [number, number],
): Color {
  const complementaryColor = _getComplementaryColor(color);
  const splitComplementaryColors =
    _getSplitComplementaryColors(complementaryColor);

  const targetColors = [...splitComplementaryColors, complementaryColor];

  // find which color from the range is closest to any of the target colors
  // using the distance in the color space OKLCH
  const closestColor = targetColors.reduce(
    (closest, target) => {
      const distance = _getDistance(target, color);
      return distance < closest.distance
        ? { color: target, distance }
        : closest;
    },
    { color: targetColors[0], distance: Infinity },
  );

  return closestColor.color;
}

function _getDistance(color1: Color, color2: Color): number {
  const color1OKLCH = convert(color1, "oklch");
  const color2OKLCH = convert(color2, "oklch");
  return Math.sqrt(
    Math.pow(color1OKLCH.l - color2OKLCH.l, 2) +
      Math.pow(color1OKLCH.c - color2OKLCH.c, 2) +
      Math.pow(color1OKLCH.h - color2OKLCH.h, 2),
  );
}

function _getComplementaryColor(color: Color): Color {
  const colorHSL = convert(color, "hsl");

  return convert({ ...colorHSL, h: (colorHSL.h + 180) % 360 }, "srgb");
}

function _getSplitComplementaryColors(color: Color): [Color, Color] {
  const colorHSL = convert(color, "hsl");

  return [
    convert({ ...colorHSL, h: (colorHSL.h + 150) % 360 }, "srgb"),
    convert({ ...colorHSL, h: (colorHSL.h + 210) % 360 }, "srgb"),
  ];
}
