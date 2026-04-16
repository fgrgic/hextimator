import { convert } from '../convert';
import { parse } from '../parse';
import type { Color } from '../types';
import type { ColorScale, GenerateOptions, ThemeType } from './types';
import { expandColorToScale, wrapHue } from './utils';

export function generateAccent(
  accent: Color,
  themeType: ThemeType,
  options?: GenerateOptions,
): ColorScale {
  const invertBaseAndAccent =
    themeType === 'dark' && options?.invertDarkModeBaseAccent;

  if (invertBaseAndAccent) {
    const accentOklch = convert(accent, 'oklch');
    const baseHueShift = options?.baseHueShift ?? 0;

    let baseOklch = options?.baseColor
      ? convert(parse(options.baseColor), 'oklch')
      : convert(accent, 'oklch');

    // When inverted with baseHueShift, the accent gets the shifted hue
    if (baseHueShift !== 0 && !options?.baseColor) {
      baseOklch = {
        ...baseOklch,
        h: wrapHue(accentOklch.h + baseHueShift),
      };
    }

    const maxChroma = options?.dark?.maxChroma;
    const invertedAccent = {
      ...baseOklch,
      c:
        maxChroma !== undefined
          ? Math.min(accentOklch.c, maxChroma)
          : accentOklch.c,
    };
    return expandColorToScale(invertedAccent, themeType, options);
  }

  return expandColorToScale(accent, themeType, options);
}
