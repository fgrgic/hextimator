import type { ColorInput, HextimateStyleOptions } from '../types';

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

/** Style options plus values derived when building a palette (e.g. from the brand color). */
export type GenerateOptions = HextimateStyleOptions & {
	inputLightness: number;
};

export type ThemeType = 'light' | 'dark';
