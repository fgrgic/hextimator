import { Color, ColorSpace } from "../types";
import { tryParseTuple } from "./parseTuple";

export function tryParseCommaSeparated(
  input: string,
  assumeSpace: ColorSpace = "srgb",
): Color | null {
  const parts = input.split(",").map((p) => p.trim());
  if (parts.length < 3 || parts.length > 4) return null;

  const numbers = parts.map(parseFloat);
  if (numbers.some(Number.isNaN)) return null;

  return tryParseTuple(
    numbers.length === 4
      ? ([numbers[0], numbers[1], numbers[2], numbers[3]] as const)
      : ([numbers[0], numbers[1], numbers[2]] as const),
    assumeSpace,
  );
}
