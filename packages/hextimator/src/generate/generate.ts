import { convert } from '../convert';
import type { Color, HextimateStyleOptions } from '../types';
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
	options?: HextimateStyleOptions,
): HextimatePalette {
	const resolvedOptions: GenerateOptions = {
		...(options ?? {}),
		inputLightness: convert(color, 'oklch').l,
	};

	return {
		surface: generateSurface(color, themeType, resolvedOptions),
		accent: generateAccent(color, themeType, resolvedOptions),
		...generateSemanticColors(color, themeType, resolvedOptions),
	};
}
