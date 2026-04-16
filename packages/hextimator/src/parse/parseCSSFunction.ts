import type { Color, DisplayP3, HSL, OKLab, OKLCH, RGB } from '../types';

const CSS_FUNC_REGULAR_EXPRESSION =
  /^(rgba?|hsla?|oklch|oklab|lab|color)\(\s*(.+?)\s*\)$/;

interface ParsedArgs {
  values: number[];
}

/**
 * Parse the inside of a CSS color function.
 * Handles:
 *   "255, 102, 102"          → comma syntax
 *   "255 102 102 / 0.5"      → space syntax with alpha
 *   "70.44% 0.1872 23.19"    → percentage values (flag preserved)
 * @param raw raw CSS function arguments string
 * @returns Parsed arguments or null if parsing failed
 */
function parseCSSArgs(raw: string): ParsedArgs | null {
  let body = raw;

  // Strip alpha if present (/ 0.5 syntax) — alpha is not supported, always 1
  const slashIdx = body.lastIndexOf('/');
  if (slashIdx !== -1) {
    body = body.slice(0, slashIdx).trim();
  }

  const parts = body.includes(',')
    ? body.split(',').map((p) => p.trim())
    : body.split(/\s+/);

  // Drop 4th value if present (rgba 4th-arg alpha syntax)
  if (parts.length === 4) {
    parts.pop();
  }

  if (parts.length !== 3) {
    return null;
  }

  const values = parts.map((p) => parseNumericValue(p));
  if (values.some(Number.isNaN)) {
    return null;
  }

  return { values };
}

/**
 * Parse a single numeric value, handling:
 *   "50%"   → 0.5 * scale (if scale provided)
 *   "none"  → 0 (CSS Color 4 spec)
 *   "0.187" → 0.187
 */
function parseNumericValue(raw: string, percentScale?: number): number {
  const s = raw.trim();

  if (s === 'none') return 0;

  if (s.endsWith('%')) {
    const base = parseFloat(s);
    return percentScale ? (base / 100) * percentScale : base / 100;
  }

  return parseFloat(s);
}

function buildRGB(args: ParsedArgs): RGB {
  const [r, g, b] = args.values;
  return { space: 'srgb', r, g, b, alpha: 1 };
}

function buildHSL(args: ParsedArgs): HSL {
  const [h, s, l] = args.values;
  return { space: 'hsl', h, s, l, alpha: 1 };
}

function buildOKLCH(args: ParsedArgs): OKLCH {
  const [l, c, h] = args.values;
  return { space: 'oklch', l, c, h, alpha: 1 };
}

function buildOKLab(args: ParsedArgs): OKLab {
  const [l, a, b] = args.values;
  return { space: 'oklab', l, a, b, alpha: 1 };
}

/**
 * CSS `color()` function: color(display-p3 0.9 0.4 0.4)
 * The first token is the color space identifier.
 */
function tryParseColorFunction(argsRaw: string): Color | null {
  const parts = argsRaw.trim().split(/\s+/);
  if (parts.length < 4) return null;

  const spaceId = parts[0];
  const rest = parts.slice(1).join(' ');

  const args = parseCSSArgs(rest);
  if (!args) return null;

  const [r, g, b] = args.values;

  switch (spaceId) {
    case 'srgb-linear':
      return { space: 'linear-rgb', r, g, b, alpha: 1 };
    case 'display-p3':
      return { space: 'display-p3', r, g, b, alpha: 1 } as DisplayP3;
    default:
      return null;
  }
}

/**
 * Try to parse a CSS function string into a Color.
 * Handles:
 *   "rgb(255, 102, 102)"
 *   "rgba(255, 102, 102, 0.5)"
 *   "hsl(200, 10%, 50%)"
 *   "hsla(200, 10%, 50%, 0.5)"
 *   "oklch(0.5 0.1 200)"
 *   "oklab(0.5 0.1 200)"
 *   "lab(0.5 0.1 200)"
 *   "color(display-p3 0.9 0.4 0.4)"
 *   "color(srgb-linear 0.9 0.4 0.4)"
 * @param input CSS function string
 * @returns Color or null if parsing failed
 */
export function tryParseCSSFunction(input: string): Color | null {
  const match = input.match(CSS_FUNC_REGULAR_EXPRESSION);
  if (!match) return null;

  const [, funcName, argsRaw] = match;

  if (funcName === 'color') {
    return tryParseColorFunction(argsRaw);
  }

  const args = parseCSSArgs(argsRaw);
  if (!args) return null;

  switch (funcName) {
    case 'rgb':
    case 'rgba':
      return buildRGB(args);
    case 'hsl':
    case 'hsla':
      return buildHSL(args);
    case 'oklch':
      return buildOKLCH(args);
    case 'oklab':
      return buildOKLab(args);
    default:
      return null;
  }
}
