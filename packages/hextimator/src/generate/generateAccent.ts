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
	const invertSurfaceAndAccent =
		themeType === 'dark' && options?.invertDarkModeSurfaceAccent;

	if (invertSurfaceAndAccent) {
		const accentOklch = convert(accent, 'oklch');
		const themeAdj = options?.dark;
		const surfaceHueShift =
			themeAdj?.surfaceHueShift ?? options?.surfaceHueShift ?? 0;

		const effectiveSurface = themeAdj?.surfaceColor ?? options?.surfaceColor;

		let surfaceOklch = effectiveSurface
			? convert(parse(effectiveSurface), 'oklch')
			: convert(accent, 'oklch');

		// When inverted with surfaceHueShift, the accent gets the shifted hue
		if (surfaceHueShift !== 0 && !effectiveSurface) {
			surfaceOklch = {
				...surfaceOklch,
				h: wrapHue(accentOklch.h + surfaceHueShift),
			};
		}

		const maxChroma = options?.dark?.maxChroma;
		const invertedAccent = {
			...surfaceOklch,
			c:
				maxChroma !== undefined
					? Math.min(accentOklch.c, maxChroma)
					: accentOklch.c,
		};
		return expandColorToScale(invertedAccent, themeType, options);
	}

	return expandColorToScale(accent, themeType, options);
}
