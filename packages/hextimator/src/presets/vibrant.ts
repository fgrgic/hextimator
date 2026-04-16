import type { HextimatePreset } from './types';

/** High-saturation palette. Colors that pop. */
export const vibrant: HextimatePreset = {
	generation: {
		light: { maxChroma: 0.2, lightness: 0.6 },
		dark: { maxChroma: 0.18, lightness: 0.65 },
		hueShift: 5,
		baseHueShift: 180,
		baseMaxChroma: 0.08,
	},
};
