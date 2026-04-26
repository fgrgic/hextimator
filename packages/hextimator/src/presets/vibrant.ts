import type { HextimatePreset } from './types';

/** High-saturation palette. Colors that pop. */
export const vibrant: HextimatePreset = {
	style: {
		light: { maxChroma: 0.2, baseLightness: 0.6 },
		dark: { maxChroma: 0.18, baseLightness: 0.65 },
		hueShift: 5,
		surfaceHueShift: 180,
		surfaceMaxChroma: 0.08,
	},
};
