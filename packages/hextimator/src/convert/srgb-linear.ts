import type { LinearRGB, RGB } from '../types';

/** Gamma decode a single sRGB channel (0-255 → 0-1 linear). */
function gammaDecodeChannel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Gamma encode a single linear channel (0-1 → 0-255 sRGB). */
function gammaEncodeChannel(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(255, Math.max(0, s * 255)));
}

/** sRGB (0-255) → Linear sRGB (0-1). */
export function srgbToLinear(color: RGB): LinearRGB {
  return {
    space: 'linear-rgb',
    r: gammaDecodeChannel(color.r),
    g: gammaDecodeChannel(color.g),
    b: gammaDecodeChannel(color.b),
    alpha: color.alpha,
  };
}

/** Linear sRGB (0-1) → sRGB (0-255, rounded). */
export function linearToSrgb(color: LinearRGB): RGB {
  return {
    space: 'srgb',
    r: gammaEncodeChannel(color.r),
    g: gammaEncodeChannel(color.g),
    b: gammaEncodeChannel(color.b),
    alpha: color.alpha,
  };
}
