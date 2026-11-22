import { baseTheme, type ThemeDefinition } from '../theme';
import type { HextimatePreset } from './types';

/** Desaturated, restrained palette. Low chroma across the board. */
export const mutedTheme = {
	...baseTheme,
	style: {
		light: { maxChroma: 0.08 },
		dark: { maxChroma: 0.07 },
		surfaceMaxChroma: 0.005,
		foregroundMaxChroma: 0.005,
	},
} satisfies ThemeDefinition;

export const muted: HextimatePreset = { style: mutedTheme.style };
