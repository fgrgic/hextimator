import { parse } from "../parse";
import { Color } from "../types";
import { ColorScale, GenerateOptions, ThemeType } from "./types";
import { expandColorToScale } from "./utils";

const DEFAULT_BASE_DARK_COLOR = "#1a1a1a";
const DEFAULT_BASE_LIGHT_COLOR = "#fafafa";

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

  return expandColorToScale(preferredBaseColor, themeType);
}
