import { convert } from "../convert";
import { Color } from "../types";
import { ColorScale, ThemeType } from "./types";
import { expandColorToScale } from "./utils";

const ACCENT_DARK_L_VALUE = 0.45;
const ACCENT_LIGHT_L_VALUE = 0.55;

export function generateAccent(
  accent: Color,
  themeType: ThemeType,
): ColorScale | null {
  const normalizedAccent = {
    ...convert(accent, "oklch"),
    l: themeType === "light" ? ACCENT_LIGHT_L_VALUE : ACCENT_DARK_L_VALUE,
  };
  return expandColorToScale(normalizedAccent, themeType);
}
