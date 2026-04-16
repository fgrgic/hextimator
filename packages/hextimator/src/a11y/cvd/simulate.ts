import { convert } from '../../convert';
import type { HextimatePalette } from '../../generate/types';
import { parse } from '../../parse';
import type { Color, OKLCH } from '../../types';
import { type CVDType, simulateCVD } from './matrices';

/**
 * Simulate how a color would appear to someone with a specific type of color vision deficiency (CVD).
 */
export function simulateColor(
  color: Color,
  type: CVDType,
  severity = 1,
): OKLCH {
  const linear = convert(color, 'linear-rgb');
  const simulated = simulateCVD([linear.r, linear.g, linear.b], type, severity);

  const simulatedLinear = {
    space: 'linear-rgb' as const,
    r: Math.max(0, simulated[0]),
    g: Math.max(0, simulated[1]),
    b: Math.max(0, simulated[2]),
    alpha: linear.alpha,
  };

  return convert(simulatedLinear, 'oklch');
}

/**
 *
 * Simulate how a palette would appear to someone with a specific type of color vision deficiency (CVD).
 * This is a purely visual simulation and does not attempt to preserve contrast or other properties.
 * The resulting palette can be used for testing or demonstration purposes, but should not be used as a basis for design decisions.
 *
 * @param palette The palette to simulate, in the same format as the output of `hextimate()`.
 * @param type The type of color vision deficiency to simulate (e.g. "protanopia", "deuteranopia", "tritanopia").
 * @param severity The severity of the color vision deficiency to simulate, on a scale from 0 (no deficiency) to 1 (complete deficiency). Default is 1.
 * @returns
 */
export function simulatePalette(
  palette: HextimatePalette,
  type: CVDType,
  severity = 1,
): HextimatePalette {
  const result: HextimatePalette = {};

  for (const role of Object.keys(palette)) {
    const scale = palette[role];
    const newScale: HextimatePalette[string] = {
      DEFAULT: scale.DEFAULT,
      strong: scale.strong,
      weak: scale.weak,
      foreground: scale.foreground,
    };

    for (const variant of Object.keys(scale)) {
      newScale[variant] = simulateColor(parse(scale[variant]), type, severity);
    }

    result[role] = newScale;
  }

  return result;
}
