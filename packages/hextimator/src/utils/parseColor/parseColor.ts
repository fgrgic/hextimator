import { ColorInput } from "bun";
import { Color, ColorSpace, ColorTuple } from "../../types";
import { tryParseCommaSeparated } from "./parseCommaSeparated";
import { tryParseCSSFunction } from "./parseCSSFunction";
import { tryParseHex } from "./parseHex";
import { tryParseNumeric } from "./parseNumeric";
import { tryParseTuple } from "./parseTuple";

class ColorParseError extends Error {
  constructor(
    public readonly input: ColorInput,
    message?: string,
  ) {
    super(message ?? `Failed to parse color:  ${String(input)}`);
    this.name = "ColorParseError";
  }
}

/**
 * Parse a ColorInput into a Color.
 *
 * If the input is already a Color, it will be returned as is.
 * If the input is a number, it will be parsed as a numeric hex value.
 * If the input is a string, it will be parsed as a hex value, CSS function, or comma separated values.
 * If the input is a tuple, it will be parsed as a color tuple.
 * If the input is a CSS function string, it will be parsed as a CSS function.
 * If the input is a comma separated values string, it will be parsed as a comma separated values.
 *
 * @param input ColorInput
 * @param assumeSpace color space to assume. If not provided, the color space will be inferred from the input, and default to 'srgb' if ambiguous
 * @returns Color or throws a ColorParseError if parsing fails
 */
export function parseColor(input: ColorInput, assumeSpace?: ColorSpace): Color {
  if (isColor(input)) return input;

  if (typeof input === "number") {
    const result = tryParseNumeric(input);
    if (result) return result;
    throw new ColorParseError(input);
  }

  if (Array.isArray(input)) {
    const result = tryParseTuple(input as ColorTuple, assumeSpace);
    if (result) return result;
    throw new ColorParseError(input);
  }

  if (typeof input === "string") {
    const normalized = _normalizeInput(input);

    const cssResult = tryParseCSSFunction(normalized);
    if (cssResult) return cssResult;

    const hexResult = tryParseHex(normalized);
    if (hexResult) return hexResult;

    const commaResult = tryParseCommaSeparated(normalized, assumeSpace);
    if (commaResult) return commaResult;

    throw new ColorParseError(input, `Unrecognized color format: ${input}`);
  }

  throw new ColorParseError(input);
}

// Helpers
function _normalizeInput(raw: string): string {
  return raw.trim().toLowerCase();
}

function isColor(value: unknown): value is Color {
  return (
    typeof value === "object" &&
    value !== null &&
    "space" in value &&
    typeof (value as Color).space === "string"
  );
}
