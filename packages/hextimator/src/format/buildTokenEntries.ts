import type { HextimatePalette } from "../generate/types";
import type { Color, ColorInput } from "../types";
import { serializeColor } from "./serializeColor";
import type { FormatOptions, TokenEntry } from "./types";

const ROLES = ["base", "accent", "positive", "negative", "warning"] as const;
const VARIANTS = ["DEFAULT", "strong", "weak", "foreground"] as const;

function isColorObject(input: ColorInput): input is Color {
  return typeof input === "object" && input !== null && "space" in input;
}

export function buildTokenEntries(
  palette: HextimatePalette,
  options?: FormatOptions,
): TokenEntry[] {
  const colorFormat = options?.colorFormat ?? "hex";
  const entries: TokenEntry[] = [];

  for (const role of ROLES) {
    const scale = palette[role];
    for (const variant of VARIANTS) {
      const raw = scale[variant];
      if (!isColorObject(raw)) continue;

      entries.push({
        role: options?.roleNames?.[role] ?? role,
        variant: options?.variantNames?.[variant] ?? variant,
        isDefault: variant === "DEFAULT",
        value: serializeColor(raw, colorFormat),
      });
    }
  }

  return entries;
}
