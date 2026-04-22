import type { Color } from '../types';
import { generateAccent } from './generateAccent';
import { generateSemanticColors } from './generateSemanticColors';
import { generateSurface } from './generateSurface';
import type { GenerateOptions, HextimatePalette, ThemeType } from './types';

export class GeneratePaletteError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'GeneratePaletteError';
	}
}

export function generate(
	color: Color,
	themeType: ThemeType,
	options?: GenerateOptions,
): HextimatePalette {
	return {
		surface: generateSurface(color, themeType, options),
		accent: generateAccent(color, themeType, options),
		...generateSemanticColors(color, themeType, options),
	};
}
