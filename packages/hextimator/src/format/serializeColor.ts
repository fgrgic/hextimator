import { convert } from "../convert";
import type { Color, ColorFormat, RGB } from "../types";

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rgbToHex(rgb: RGB): string {
  const r = Math.round(clamp(rgb.r, 0, 255));
  const g = Math.round(clamp(rgb.g, 0, 255));
  const b = Math.round(clamp(rgb.b, 0, 255));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function serializeColor(
  color: Color,
  colorFormat: ColorFormat = "hex",
): string {
  switch (colorFormat) {
    case "hex": {
      return rgbToHex(convert(color, "srgb"));
    }
    case "rgb": {
      const rgb = convert(color, "srgb");
      return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
    }
    case "rgb-raw": {
      const rgb = convert(color, "srgb");
      return `${Math.round(rgb.r)} ${Math.round(rgb.g)} ${Math.round(rgb.b)}`;
    }
    case "hsl": {
      const hsl = convert(color, "hsl");
      return `hsl(${round(hsl.h, 1)}, ${round(hsl.s, 1)}%, ${round(hsl.l, 1)}%)`;
    }
    case "hsl-raw": {
      const hsl = convert(color, "hsl");
      return `${round(hsl.h, 1)} ${round(hsl.s, 1)}% ${round(hsl.l, 1)}%`;
    }
    case "oklch": {
      const oklch = convert(color, "oklch");
      return `oklch(${round(oklch.l, 4)} ${round(oklch.c, 4)} ${round(oklch.h, 1)})`;
    }
    case "oklch-raw": {
      const oklch = convert(color, "oklch");
      return `${round(oklch.l, 4)} ${round(oklch.c, 4)} ${round(oklch.h, 1)}`;
    }
  }
}
