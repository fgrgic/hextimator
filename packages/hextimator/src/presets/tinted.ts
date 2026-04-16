import type { HextimatePreset } from './types';

/** Neutrals pick up the accent hue for a cohesive, branded feel. */
export const tinted: HextimatePreset = {
	generation: {
		baseMaxChroma: 0.05,
		baseHueShift: 0,
		foregroundMaxChroma: 0.015,
	},
};
