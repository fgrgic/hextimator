// src/utils/parseColor/parseTuple.ts
function tryParseTuple(t, assumeSpace = "srgb") {
  const [a, b, c, maybeAlpha] = t;
  const alpha = maybeAlpha ?? 1;
  switch (assumeSpace) {
    case "srgb":
      return { space: "srgb", r: a, g: b, b: c, alpha };
    case "hsl":
      return { space: "hsl", h: a, s: b, l: c, alpha };
    case "oklch":
      return { space: "oklch", l: a, c: b, h: c, alpha };
    case "oklab":
      return { space: "oklab", l: a, a: b, b: c, alpha };
    case "lab":
      return { space: "lab", l: a, a: b, b: c, alpha };
    case "linear-rgb":
      return { space: "linear-rgb", r: a, g: b, b: c, alpha };
    case "p3":
      return { space: "p3", r: a, g: b, b: c, alpha };
    default:
      return null;
  }
}

// src/utils/parseColor/parseCommaSeparated.ts
function tryParseCommaSeparated(input, assumeSpace = "srgb") {
  const parts = input.split(",").map((p) => p.trim());
  if (parts.length < 3 || parts.length > 4) return null;
  const numbers = parts.map(parseFloat);
  if (numbers.some(Number.isNaN)) return null;
  return tryParseTuple(
    numbers.length === 4 ? [numbers[0], numbers[1], numbers[2], numbers[3]] : [numbers[0], numbers[1], numbers[2]],
    assumeSpace
  );
}

// src/utils/parseColor/parseCSSFunction.ts
var CSS_FUNC_REGULAR_EXPRESSION = /^(rgba?|hsla?|oklch|oklab|lab|color)\(\s*(.+?)\s*\)$/;
function parseCSSArgs(raw) {
  let alpha = 1;
  let body = raw;
  const slashIdx = body.lastIndexOf("/");
  const commaIdx = body.lastIndexOf(",");
  if (slashIdx !== -1) {
    const alphaPart = body.slice(slashIdx + 1);
    alpha = parseNumericValue(alphaPart);
    body = body.slice(0, slashIdx).trim();
  }
  const parts = body.includes(",") ? body.split(",").map((p) => p.trim()) : body.split(/\s+/);
  if (parts.length === 4 && slashIdx !== -1 || parts.length === 4 && commaIdx !== -1) {
    alpha = parseNumericValue(parts.pop(), 1);
  }
  if (parts.length !== 3) {
    return null;
  }
  const values = parts.map((p) => parseNumericValue(p));
  if (values.some(Number.isNaN)) {
    return null;
  }
  return { values, alpha };
}
function parseNumericValue(raw, percentScale) {
  const s = raw.trim();
  if (s === "none") return 0;
  if (s.endsWith("%")) {
    const base = parseFloat(s);
    return percentScale ? base / 100 * percentScale : base / 100;
  }
  return parseFloat(s);
}
function buildRGB(args) {
  const [r, g, b] = args.values;
  return { space: "srgb", r, g, b, alpha: args.alpha };
}
function buildHSL(args) {
  const [h, s, l] = args.values;
  return { space: "hsl", h, s, l, alpha: args.alpha };
}
function buildOKLCH(args) {
  const [l, c, h] = args.values;
  return { space: "oklch", l, c, h, alpha: args.alpha };
}
function buildOKLab(args) {
  const [l, a, b] = args.values;
  return { space: "oklab", l, a, b, alpha: args.alpha };
}
function buildLab(args) {
  const [l, a, b] = args.values;
  return { space: "lab", l, a, b, alpha: args.alpha };
}
function tryParseColorFunction(argsRaw) {
  const parts = argsRaw.trim().split(/\s+/);
  if (parts.length < 4) return null;
  const spaceId = parts[0];
  const rest = parts.slice(1).join(" ");
  const args = parseCSSArgs(rest);
  if (!args) return null;
  const [r, g, b] = args.values;
  switch (spaceId) {
    case "display-p3":
      return { space: "p3", r, g, b, alpha: args.alpha };
    case "srgb-linear":
      return { space: "linear-rgb", r, g, b, alpha: args.alpha };
    // .. add other spaces here
    default:
      return null;
  }
}
function tryParseCSSFunction(input) {
  const match = input.match(CSS_FUNC_REGULAR_EXPRESSION);
  if (!match) return null;
  const [, funcName, argsRaw] = match;
  if (funcName === "color") {
    return tryParseColorFunction(argsRaw);
  }
  const args = parseCSSArgs(argsRaw);
  if (!args) return null;
  switch (funcName) {
    case "rgb":
    case "rgba":
      return buildRGB(args);
    case "hsl":
    case "hsla":
      return buildHSL(args);
    case "oklch":
      return buildOKLCH(args);
    case "oklab":
      return buildOKLab(args);
    case "lab":
      return buildLab(args);
    default:
      return null;
  }
}

// src/utils/parseColor/parseHex.ts
var HEX_PATTERNS = {
  prefixed: /^#([0-9a-f]{3,8})$/,
  // e.g. #FF6666
  numeric: /^0x([0-9a-f]{6}|[0-9a-f]{8})$/,
  // e.g. 0xFF6666
  bare: /^([0-9a-f]{6}|[0-9a-f]{8})$/
  // e.g. FF6666
};
function parseHexDigits(hex) {
  if (hex.length === 3 || hex.length === 4) {
    hex = [...hex].map((c) => c + c).join("");
  }
  if (hex.length !== 6 && hex.length !== 8) {
    return null;
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  if ([r, g, b, alpha].some(Number.isNaN)) {
    return null;
  }
  return { space: "srgb", r, g, b, alpha };
}
function tryParseHex(input) {
  for (const pattern of Object.values(HEX_PATTERNS)) {
    const match = input.match(pattern);
    if (match) {
      return parseHexDigits(match[1]);
    }
  }
  return null;
}

// src/utils/parseColor/parseNumeric.ts
function tryParseNumeric(n) {
  if (!Number.isInteger(n) || n < 0 || n > 4294967295) return null;
  if (n <= 16777215) {
    return {
      space: "srgb",
      r: n >> 16 & 255,
      g: n >> 8 & 255,
      b: n & 255,
      alpha: 1
    };
  }
  return {
    space: "srgb",
    r: n >> 24 & 255,
    g: n >> 16 & 255,
    b: n >> 8 & 255,
    alpha: (n & 255) / 255
  };
}

// src/utils/parseColor/parseColor.ts
var ColorParseError = class extends Error {
  constructor(input, message) {
    super(message ?? `Failed to parse color:  ${String(input)}`);
    this.input = input;
    this.name = "ColorParseError";
  }
};
function parseColor(input, assumeSpace) {
  if (isColor(input)) return input;
  if (typeof input === "number") {
    const result = tryParseNumeric(input);
    if (result) return result;
    throw new ColorParseError(input);
  }
  if (Array.isArray(input)) {
    const result = tryParseTuple(input, assumeSpace);
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
function _normalizeInput(raw) {
  return raw.trim().toLowerCase();
}
function isColor(value) {
  return typeof value === "object" && value !== null && "space" in value && typeof value.space === "string";
}

// src/index.ts
function hextimate(color, options) {
  const parsedColor = parseColor(color);
  if (!parsedColor) return null;
  return parsedColor;
}
export {
  hextimate
};
