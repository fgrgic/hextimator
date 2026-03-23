import { convert } from '../convert';
import { parse } from '../parse';
import type { Color } from '../types';
import type { ColorScale, GenerateOptions, ThemeType } from './types';
import { expandColorToScale } from './utils';

export function generateAccent(
	accent: Color,
	themeType: ThemeType,
	options?: GenerateOptions,
): ColorScale {
	const invertBaseAndAccent =
		themeType === 'dark' && options?.invertDarkModeBaseAccent;

	if (invertBaseAndAccent) {
		const accentOklch = convert(accent, 'oklch');
		const baseOklch = convert(parse(options?.baseColor ?? accent), 'oklch');
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
