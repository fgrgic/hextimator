import type { HextimatePreset } from './types';

/** Neutrals pick up the accent hue for a cohesive, branded feel. */
export const tinted: HextimatePreset = {
	style: {
		surfaceMaxChroma: 0.05,
		surfaceHueShift: 0,
		foregroundMaxChroma: 0.015,
	},
};
