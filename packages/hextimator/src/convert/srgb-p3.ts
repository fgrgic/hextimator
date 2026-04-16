import type { DisplayP3, LinearRGB, RGB } from '../types';
import { multiplyMatrix3 } from './matrices';
import { LINEAR_P3_TO_SRGB, LINEAR_SRGB_TO_P3 } from './p3-matrices';

/**
 * Display P3 uses the same transfer function (TRC) as sRGB,
 * but with wider primaries. Values are in 0-1 range.
 */

function gammaDecode(s: number): number {
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function gammaEncode(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}

/** Display P3 → Linear sRGB. */
export function displayP3ToLinearSrgb(color: DisplayP3): LinearRGB {
  const linP3: [number, number, number] = [
    gammaDecode(color.r),
    gammaDecode(color.g),
    gammaDecode(color.b),
  ];
  const [r, g, b] = multiplyMatrix3(LINEAR_P3_TO_SRGB, linP3);
  return { space: 'linear-rgb', r, g, b, alpha: color.alpha };
}

/** Linear sRGB → Display P3. */
export function linearSrgbToDisplayP3(color: LinearRGB): DisplayP3 {
  const [rLin, gLin, bLin] = multiplyMatrix3(LINEAR_SRGB_TO_P3, [
    color.r,
    color.g,
    color.b,
  ]);
  return {
    space: 'display-p3',
    r: gammaEncode(rLin),
    g: gammaEncode(gLin),
    b: gammaEncode(bLin),
    alpha: color.alpha,
  };
}

/** sRGB (0-255) → Display P3. */
export function srgbToDisplayP3(color: RGB): DisplayP3 {
  const rLin =
    color.r <= 0.04045 * 255
      ? color.r / 255 / 12.92
      : ((color.r / 255 + 0.055) / 1.055) ** 2.4;
  const gLin =
    color.g <= 0.04045 * 255
      ? color.g / 255 / 12.92
      : ((color.g / 255 + 0.055) / 1.055) ** 2.4;
  const bLin =
    color.b <= 0.04045 * 255
      ? color.b / 255 / 12.92
      : ((color.b / 255 + 0.055) / 1.055) ** 2.4;

  const [rP3, gP3, bP3] = multiplyMatrix3(LINEAR_SRGB_TO_P3, [
    rLin,
    gLin,
    bLin,
  ]);
  return {
    space: 'display-p3',
    r: gammaEncode(rP3),
    g: gammaEncode(gP3),
    b: gammaEncode(bP3),
    alpha: color.alpha,
  };
}

/** Display P3 → sRGB (0-255, rounded). */
export function displayP3ToSrgb(color: DisplayP3): RGB {
  const linP3: [number, number, number] = [
    gammaDecode(color.r),
    gammaDecode(color.g),
    gammaDecode(color.b),
  ];
  const [rLin, gLin, bLin] = multiplyMatrix3(LINEAR_P3_TO_SRGB, linP3);

  function encodeChannel(c: number): number {
    const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(255, Math.max(0, s * 255)));
  }

  return {
    space: 'srgb',
    r: encodeChannel(rLin),
    g: encodeChannel(gLin),
    b: encodeChannel(bLin),
    alpha: color.alpha,
  };
}
