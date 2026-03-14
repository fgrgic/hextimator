import { RGB } from "../../types";

/**
 * Try to parse a numeric hex value into a RGB Color.
 * e.g. 0xFF6666 → { space: "srgb", r: 255, g: 102, b: 102, alpha: 1 }
 * @param n numeric hex value
 * @returns RGB Color or null if parsing failed
 */
export function tryParseNumeric(n: number): RGB | null {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) return null;

  if (n <= 0xffffff) {
    return {
      space: "srgb",
      r: (n >> 16) & 0xff,
      g: (n >> 8) & 0xff,
      b: n & 0xff,
      alpha: 1,
    };
  }

  return {
    space: "srgb",
    r: (n >> 24) & 0xff,
    g: (n >> 16) & 0xff,
    b: (n >> 8) & 0xff,
    alpha: (n & 0xff) / 255,
  };
}
