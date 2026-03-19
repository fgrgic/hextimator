import type { ColorInput, HextimateOptions } from '../types';

export interface ColorScale {
	DEFAULT: ColorInput;
	strong: ColorInput;
	weak: ColorInput;
	foreground: ColorInput;
}

export interface HextimatePalette {
	base: ColorScale;
	accent: ColorScale;
	positive: ColorScale;
	negative: ColorScale;
	warning: ColorScale;
}

export type GenerateOptions = Pick<
	HextimateOptions,
	| 'preferredBaseColors'
	| 'semanticColors'
	| 'semanticColorRanges'
	| 'neutralColorsMaxChroma'
	| 'themeLightness'
>;

export type ThemeType = 'light' | 'dark';
