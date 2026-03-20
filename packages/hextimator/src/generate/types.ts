import type { ColorInput, HextimateGenerationOptions } from '../types';

export interface ColorScale {
	DEFAULT: ColorInput;
	strong: ColorInput;
	weak: ColorInput;
	foreground: ColorInput;
	[variant: string]: ColorInput;
}

export interface HextimatePalette {
	[role: string]: ColorScale;
}

export type GenerateOptions = HextimateGenerationOptions;

export type ThemeType = 'light' | 'dark';
