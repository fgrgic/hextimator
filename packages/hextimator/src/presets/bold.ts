import type { HextimatePreset } from './types';

/**
 * Darker accents on light themes, lighter accents on dark themes.
 * Higher chroma for neutrals.
 */
export const bold: HextimatePreset = {
	generation: {
		light: { lightness: 0.5 },
		dark: { lightness: 0.8 },
		baseMaxChroma: 0.06,
		foregroundMaxChroma: 0.02,
	},
};
