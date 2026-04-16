import type { HSL, RGB } from '../types';

/** sRGB (0-255) → HSL (h: 0-360, s: 0-100, l: 0-100). */
export function srgbToHsl(color: RGB): HSL {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;

  if (d === 0) {
    return { space: 'hsl', h: 0, s: 0, l: l * 100, alpha: color.alpha };
  }

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return {
    space: 'hsl',
    h: h * 360,
    s: s * 100,
    l: l * 100,
    alpha: color.alpha,
  };
}

/** HSL (h: 0-360, s: 0-100, l: 0-100) → sRGB (0-255). */
export function hslToSrgb(color: HSL): RGB {
  const h = color.h / 360;
  const s = color.s / 100;
  const l = color.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { space: 'srgb', r: v, g: v, b: v, alpha: color.alpha };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    space: 'srgb',
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
    alpha: color.alpha,
  };
}

function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
