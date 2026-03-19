import type { Color } from '../types';
import type { ColorScale, GenerateOptions, ThemeType } from './types';
import { expandColorToScale } from './utils';

export function generateAccent(
	accent: Color,
	themeType: ThemeType,
	options?: GenerateOptions,
): ColorScale {
	return expandColorToScale(accent, themeType, options);
}
