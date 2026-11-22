import { baseTheme, type ThemeDefinition } from '../theme';
import type { HextimatePreset } from './types';

/** High-saturation palette. Colors that pop. */
export const vibrantTheme = {
	...baseTheme,
	style: {
		light: { maxChroma: 0.2, baseLightness: 0.6 },
		dark: { maxChroma: 0.18, baseLightness: 0.65 },
		hueShift: 5,
		surfaceHueShift: 180,
		surfaceMaxChroma: 0.08,
	},
} satisfies ThemeDefinition;

export const vibrant: HextimatePreset = { style: vibrantTheme.style };
