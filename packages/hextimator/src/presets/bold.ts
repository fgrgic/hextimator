import type { HextimatePreset } from './types';

/**
 * Darker accents on light themes, lighter accents on dark themes.
 * Higher chroma for neutrals.
 */
export const bold: HextimatePreset = {
	style: {
		light: { baseLightness: 0.5 },
		dark: { baseLightness: 0.8 },
		surfaceMaxChroma: 0.06,
		foregroundMaxChroma: 0.02,
	},
};
