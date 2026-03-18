"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toCommonJS = (mod) =>
  __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  convertColor: () => convert,
  hextimate: () => hextimate,
  parseColor: () => parse,
});
module.exports = __toCommonJS(index_exports);

// src/convert/matrices.ts
var M1 = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
];
var M2 = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
];
var M1_INV = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
];
var M2_INV = [
  [1, 0.3963377774, 0.2158037573],
  [1, -0.1055613458, -0.0638541728],
  [1, -0.0894841775, -1.291485548],
];
function multiplyMatrix3(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

// src/convert/linear-oklab.ts
function linearRgbToOklab(color) {
  const lms = multiplyMatrix3(M1, [color.r, color.g, color.b]);
  const lms_ = lms.map((v) => Math.cbrt(v));
  const [l, a, b] = multiplyMatrix3(M2, lms_);
  return { space: "oklab", l, a, b, alpha: color.alpha };
}
function oklabToLinearRgb(color) {
  const lms_ = multiplyMatrix3(M2_INV, [color.l, color.a, color.b]);
  const lms = lms_.map((v) => v * v * v);
  const [r, g, b] = multiplyMatrix3(M1_INV, lms);
  return { space: "linear-rgb", r, g, b, alpha: color.alpha };
}

// src/convert/oklab-oklch.ts
var RAD_TO_DEG = 180 / Math.PI;
var DEG_TO_RAD = Math.PI / 180;
function oklabToOklch(color) {
  const c = Math.sqrt(color.a * color.a + color.b * color.b);
  let h = Math.atan2(color.b, color.a) * RAD_TO_DEG;
  if (h < 0) h += 360;
  return { space: "oklch", l: color.l, c, h, alpha: color.alpha };
}
function oklchToOklab(color) {
  const hRad = color.h * DEG_TO_RAD;
  return {
    space: "oklab",
    l: color.l,
    a: color.c * Math.cos(hRad),
    b: color.c * Math.sin(hRad),
    alpha: color.alpha,
  };
}

// src/convert/srgb-hsl.ts
function srgbToHsl(color) {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) {
    return { space: "hsl", h: 0, s: 0, l: l * 100, alpha: color.alpha };
  }
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }
  return {
    space: "hsl",
    h: h * 360,
    s: s * 100,
    l: l * 100,
    alpha: color.alpha,
  };
}
function hslToSrgb(color) {
  const h = color.h / 360;
  const s = color.s / 100;
  const l = color.l / 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { space: "srgb", r: v, g: v, b: v, alpha: color.alpha };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    space: "srgb",
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
    alpha: color.alpha,
  };
}
function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

// src/convert/srgb-linear.ts
function gammaDecodeChannel(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function gammaEncodeChannel(c) {
  const s = c <= 31308e-7 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(255, Math.max(0, s * 255)));
}
function srgbToLinear(color) {
  return {
    space: "linear-rgb",
    r: gammaDecodeChannel(color.r),
    g: gammaDecodeChannel(color.g),
    b: gammaDecodeChannel(color.b),
    alpha: color.alpha,
  };
}
function linearToSrgb(color) {
  return {
    space: "srgb",
    r: gammaEncodeChannel(color.r),
    g: gammaEncodeChannel(color.g),
    b: gammaEncodeChannel(color.b),
    alpha: color.alpha,
  };
}

// src/convert/index.ts
function chain(...fns) {
  return (color) => fns.reduce((c, fn) => fn(c), color);
}
var conversions = {
  // srgb ↔ linear-rgb
  "srgb->linear-rgb": srgbToLinear,
  "linear-rgb->srgb": linearToSrgb,
  // linear-rgb ↔ oklab
  "linear-rgb->oklab": linearRgbToOklab,
  "oklab->linear-rgb": oklabToLinearRgb,
  // oklab ↔ oklch
  "oklab->oklch": oklabToOklch,
  "oklch->oklab": oklchToOklab,
  // srgb ↔ hsl
  "srgb->hsl": srgbToHsl,
  "hsl->srgb": hslToSrgb,
  // srgb → oklab / oklch
  "srgb->oklab": chain(srgbToLinear, linearRgbToOklab),
  "srgb->oklch": chain(srgbToLinear, linearRgbToOklab, oklabToOklch),
  // oklab / oklch → srgb
  "oklab->srgb": chain(oklabToLinearRgb, linearToSrgb),
  "oklch->srgb": chain(oklchToOklab, oklabToLinearRgb, linearToSrgb),
  // linear-rgb → oklch
  "linear-rgb->oklch": chain(linearRgbToOklab, oklabToOklch),
  "oklch->linear-rgb": chain(oklchToOklab, oklabToLinearRgb),
  // hsl ↔ linear-rgb
  "hsl->linear-rgb": chain(hslToSrgb, srgbToLinear),
  "linear-rgb->hsl": chain(linearToSrgb, srgbToHsl),
  // hsl ↔ oklab
  "hsl->oklab": chain(hslToSrgb, srgbToLinear, linearRgbToOklab),
  "oklab->hsl": chain(oklabToLinearRgb, linearToSrgb, srgbToHsl),
  // hsl ↔ oklch
  "hsl->oklch": chain(hslToSrgb, srgbToLinear, linearRgbToOklab, oklabToOklch),
  "oklch->hsl": chain(oklchToOklab, oklabToLinearRgb, linearToSrgb, srgbToHsl),
};
function convert(color, to) {
  if (color.space === to) {
    return { ...color };
  }
  const key = `${color.space}->${to}`;
  const fn = conversions[key];
  if (!fn) {
    throw new Error(`Unsupported conversion: ${color.space} \u2192 ${to}`);
  }
  return fn(color);
}

// src/generate/utils.ts
var BASELINE_DARK_L_VALUE = 0.4;
var BASELINE_LIGHT_L_VALUE = 0.6;
var FOREGROUND_DARK_L_VALUE = 0.98;
var FOREGROUND_LIGHT_L_VALUE = 0.1;
var STRONG_DELTA_DARK = -0.05;
var STRONG_DELTA_LIGHT = 0.05;
var WEAK_DELTA_DARK = 0.05;
var WEAK_DELTA_LIGHT = -0.05;
function expandColorToScale(color, themeType, options) {
  const {
    baselineLValueDark = BASELINE_DARK_L_VALUE,
    baselineLValueLight = BASELINE_LIGHT_L_VALUE,
    foregroundLValueDark = FOREGROUND_DARK_L_VALUE,
    foregroundLValueLight = FOREGROUND_LIGHT_L_VALUE,
    strongDeltaDark = STRONG_DELTA_DARK,
    strongDeltaLight = STRONG_DELTA_LIGHT,
    weakDeltaDark = WEAK_DELTA_DARK,
    weakDeltaLight = WEAK_DELTA_LIGHT,
  } = options ?? {};
  const colorOKLCH = convert(color, "oklch");
  const normalizedColorOKLCH = {
    ...colorOKLCH,
    l: themeType === "light" ? baselineLValueLight : baselineLValueDark,
  };
  const strongColorOKLCH = {
    ...normalizedColorOKLCH,
    l:
      normalizedColorOKLCH.l +
      (themeType === "light" ? strongDeltaLight : strongDeltaDark),
  };
  const weakColorOKLCH = {
    ...normalizedColorOKLCH,
    l:
      normalizedColorOKLCH.l +
      (themeType === "light" ? weakDeltaLight : weakDeltaDark),
  };
  const foregroundColorOKLCH = {
    ...colorOKLCH,
    l: themeType === "light" ? foregroundLValueLight : foregroundLValueDark,
  };
  return {
    DEFAULT: convert(colorOKLCH, "srgb") ?? void 0,
    strong: convert(strongColorOKLCH, "srgb") ?? void 0,
    weak: convert(weakColorOKLCH, "srgb") ?? void 0,
    foreground: convert(foregroundColorOKLCH, "srgb") ?? void 0,
  };
}

// src/generate/generateAccent.ts
var ACCENT_DARK_L_VALUE = 0.4;
var ACCENT_LIGHT_L_VALUE = 0.6;
var FOREGROUND_DARK_L_VALUE2 = 0.98;
var FOREGROUND_LIGHT_L_VALUE2 = 0.1;
var STRONG_DELTA_DARK2 = -0.05;
var STRONG_DELTA_LIGHT2 = 0.05;
var WEAK_DELTA_DARK2 = 0.05;
var WEAK_DELTA_LIGHT2 = -0.05;
function generateAccent(accent, themeType) {
  return expandColorToScale(accent, themeType, {
    baselineLValueDark: ACCENT_DARK_L_VALUE,
    baselineLValueLight: ACCENT_LIGHT_L_VALUE,
    foregroundLValueDark: FOREGROUND_DARK_L_VALUE2,
    foregroundLValueLight: FOREGROUND_LIGHT_L_VALUE2,
    strongDeltaDark: STRONG_DELTA_DARK2,
    strongDeltaLight: STRONG_DELTA_LIGHT2,
    weakDeltaDark: WEAK_DELTA_DARK2,
    weakDeltaLight: WEAK_DELTA_LIGHT2,
  });
}

// src/parse/parseTuple.ts
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

// src/parse/parseCommaSeparated.ts
function tryParseCommaSeparated(input, assumeSpace = "srgb") {
  const parts = input.split(",").map((p) => p.trim());
  if (parts.length < 3 || parts.length > 4) return null;
  const numbers = parts.map(parseFloat);
  if (numbers.some(Number.isNaN)) return null;
  return tryParseTuple(
    numbers.length === 4
      ? [numbers[0], numbers[1], numbers[2], numbers[3]]
      : [numbers[0], numbers[1], numbers[2]],
    assumeSpace,
  );
}

// src/parse/parseCSSFunction.ts
var CSS_FUNC_REGULAR_EXPRESSION =
  /^(rgba?|hsla?|oklch|oklab|lab|color)\(\s*(.+?)\s*\)$/;
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
  const parts = body.includes(",")
    ? body.split(",").map((p) => p.trim())
    : body.split(/\s+/);
  if (
    (parts.length === 4 && slashIdx !== -1) ||
    (parts.length === 4 && commaIdx !== -1)
  ) {
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
    return percentScale ? (base / 100) * percentScale : base / 100;
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

// src/parse/parseHex.ts
var HEX_PATTERNS = {
  prefixed: /^#([0-9a-f]{3,8})$/,
  // e.g. #FF6666
  numeric: /^0x([0-9a-f]{6}|[0-9a-f]{8})$/,
  // e.g. 0xFF6666
  bare: /^([0-9a-f]{6}|[0-9a-f]{8})$/,
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

// src/parse/parseNumeric.ts
function tryParseNumeric(n) {
  if (!Number.isInteger(n) || n < 0 || n > 4294967295) return null;
  if (n <= 16777215) {
    return {
      space: "srgb",
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255,
      alpha: 1,
    };
  }
  return {
    space: "srgb",
    r: (n >> 24) & 255,
    g: (n >> 16) & 255,
    b: (n >> 8) & 255,
    alpha: (n & 255) / 255,
  };
}

// src/parse/parse.ts
var ColorParseError = class extends Error {
  constructor(input, message) {
    super(message ?? `Failed to parse color:  ${String(input)}`);
    this.input = input;
    this.name = "ColorParseError";
  }
};
function parse(input, assumeSpace) {
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
  return (
    typeof value === "object" &&
    value !== null &&
    "space" in value &&
    typeof value.space === "string"
  );
}

// src/generate/generateBase.ts
var DEFAULT_BASE_DARK_COLOR = "#1a1a1a";
var DEFAULT_BASE_LIGHT_COLOR = "#fafafa";
var BASELINE_DARK_L_VALUE2 = 0.1;
var BASELINE_LIGHT_L_VALUE2 = 0.95;
var FOREGROUND_DARK_L_VALUE3 = 0.98;
var FOREGROUND_LIGHT_L_VALUE3 = 0.1;
var STRONG_DELTA_DARK3 = -0.05;
var STRONG_DELTA_LIGHT3 = 0.05;
var WEAK_DELTA_DARK3 = 0.05;
var WEAK_DELTA_LIGHT3 = -0.05;
function generateBase(color, themeType, options) {
  const preferredBaseColorInput =
    themeType === "light"
      ? (options?.preferredBaseColors?.light ?? DEFAULT_BASE_LIGHT_COLOR)
      : (options?.preferredBaseColors?.dark ?? DEFAULT_BASE_DARK_COLOR);
  const preferredBaseColor = parse(preferredBaseColorInput);
  if (!preferredBaseColor) return null;
  return expandColorToScale(preferredBaseColor, themeType, {
    baselineLValueDark: BASELINE_DARK_L_VALUE2,
    baselineLValueLight: BASELINE_LIGHT_L_VALUE2,
    foregroundLValueDark: FOREGROUND_DARK_L_VALUE3,
    foregroundLValueLight: FOREGROUND_LIGHT_L_VALUE3,
    strongDeltaDark: STRONG_DELTA_DARK3,
    strongDeltaLight: STRONG_DELTA_LIGHT3,
    weakDeltaDark: WEAK_DELTA_DARK3,
    weakDeltaLight: WEAK_DELTA_LIGHT3,
  });
}

// src/generate/generateSemanticColors.ts
var POSITIVE_RANGE = [90, 150];
var NEGATIVE_RANGE = [345, 15];
var WARNING_RANGE = [35, 55];
function generateSemanticColors(color, themeType, options) {
  const positiveBaseColor = parse(
    options?.semanticColors?.positive ??
      _determineBaseColorFromRange(
        color,
        options?.semanticColorRanges?.positive ?? POSITIVE_RANGE,
      ),
  );
  if (!positiveBaseColor) return null;
  console.log("positiveBaseColor", positiveBaseColor);
  const negativeBaseColor = parse(
    options?.semanticColors?.negative ??
      _determineBaseColorFromRange(
        color,
        options?.semanticColorRanges?.negative ?? NEGATIVE_RANGE,
      ),
  );
  if (!negativeBaseColor) return null;
  console.log("negativeBaseColor", negativeBaseColor);
  const warningBaseColor = parse(
    options?.semanticColors?.warning ??
      _determineBaseColorFromRange(
        color,
        options?.semanticColorRanges?.warning ?? WARNING_RANGE,
      ),
  );
  if (!warningBaseColor) return null;
  const positiveColorScale = expandColorToScale(positiveBaseColor, themeType);
  const negativeColorScale = expandColorToScale(negativeBaseColor, themeType);
  const warningColorScale = expandColorToScale(warningBaseColor, themeType);
  console.log("warningBaseColor", warningBaseColor);
  return {
    positive: positiveColorScale,
    negative: negativeColorScale,
    warning: warningColorScale,
  };
}
function _determineBaseColorFromRange(color, range) {
  const complementaryColor = _getComplementaryColor(color);
  const splitComplementaryColors =
    _getSplitComplementaryColors(complementaryColor);
  const targetColors = [...splitComplementaryColors, complementaryColor];
  const closestColor = targetColors.reduce(
    (closest, target) => {
      const distance = _getDistance(target, color);
      return distance < closest.distance
        ? { color: target, distance }
        : closest;
    },
    { color: targetColors[0], distance: Infinity },
  );
  return closestColor.color;
}
function _getDistance(color1, color2) {
  const color1OKLCH = convert(color1, "oklch");
  const color2OKLCH = convert(color2, "oklch");
  return Math.sqrt(
    Math.pow(color1OKLCH.l - color2OKLCH.l, 2) +
      Math.pow(color1OKLCH.c - color2OKLCH.c, 2) +
      Math.pow(color1OKLCH.h - color2OKLCH.h, 2),
  );
}
function _getComplementaryColor(color) {
  const colorHSL = convert(color, "hsl");
  return convert({ ...colorHSL, h: (colorHSL.h + 180) % 360 }, "srgb");
}
function _getSplitComplementaryColors(color) {
  const colorHSL = convert(color, "hsl");
  return [
    convert({ ...colorHSL, h: (colorHSL.h + 150) % 360 }, "srgb"),
    convert({ ...colorHSL, h: (colorHSL.h + 210) % 360 }, "srgb"),
  ];
}

// src/generate/generate.ts
function generate(color, themeType, options) {
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

// src/index.ts
function hextimate(color, options) {
  const parsedColor = parse(color);
  if (!parsedColor) return null;
  const lightPalette = generate(parsedColor, "light", options);
  const darkPalette = generate(parsedColor, "dark", options);
  if (!lightPalette || !darkPalette) return null;
  return {
    light: lightPalette,
    dark: darkPalette,
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    convertColor,
    hextimate,
    parseColor,
  });
