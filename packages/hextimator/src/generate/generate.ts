import { convert } from '../convert';
import type { RoleGenerator } from '../theme';
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

const DEFAULT_ROLES: Array<{ name: string; generate: RoleGenerator }> = [
	{ name: 'surface', generate: 'surface' },
	{ name: 'accent', generate: 'accent' },
	{ name: 'positive', generate: 'positive' },
	{ name: 'negative', generate: 'negative' },
	{ name: 'caution', generate: 'caution' },
];

export function generate(
	color: Color,
	themeType: ThemeType,
	options?: HextimateStyleOptions,
	roles = DEFAULT_ROLES,
): HextimatePalette {
	if (roles.filter((r) => r.generate === 'surface').length > 1) {
		throw new GeneratePaletteError(
			'A theme can declare only one surface role.',
		);
	}

	const resolvedOptions: GenerateOptions = {
		...(options ?? {}),
		inputLightness: convert(color, 'oklch').l,
	};

	let semantic: ReturnType<typeof generateSemanticColors> | undefined;
	const palette: HextimatePalette = {};
	for (const { name, generate: kind } of roles) {
		if (kind === 'surface') {
			palette[name] = generateSurface(color, themeType, resolvedOptions);
		} else if (kind === 'accent') {
			palette[name] = generateAccent(color, themeType, resolvedOptions);
		} else {
			semantic ??= generateSemanticColors(color, themeType, resolvedOptions);
			palette[name] = { ...semantic[kind] };
		}
	}
	return palette;
}
