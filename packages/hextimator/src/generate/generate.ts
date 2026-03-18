import { Color } from "../types";
import { generateAccent } from "./generateAccent";
import { generateBase } from "./generateBase";
import { generateSemanticColors } from "./generateSemanticColors";
import { GenerateOptions, HextimatePalette, ThemeType } from "./types";

export function generate(
  color: Color,
  themeType: ThemeType,
  options?: GenerateOptions,
): HextimatePalette | null {
  const accent = generateAccent(color, themeType);
  if (!accent) return null;

  const base = generateBase(color, themeType, options);
  if (!base) return null;

  const semanticColors = generateSemanticColors(color, themeType, options);
  if (!semanticColors) return null;

  return {
    base,
    accent,
    positive: semanticColors.positive,
    negative: semanticColors.negative,
    warning: semanticColors.warning,
  };
}
