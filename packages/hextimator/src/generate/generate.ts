import { convert } from '../convert';
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
	const resolved: GenerateOptions = {
		...options,
		inputLightness: convert(color, 'oklch').l,
	};

	return {
		surface: generateSurface(color, themeType, resolved),
		accent: generateAccent(color, themeType, resolved),
		...generateSemanticColors(color, themeType, resolved),
	};
}
