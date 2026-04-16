import type { HextimatePreset } from './types';

/** Desaturated, restrained palette. Low chroma across the board. */
export const muted: HextimatePreset = {
  style: {
    light: { maxChroma: 0.08 },
    dark: { maxChroma: 0.07 },
    baseMaxChroma: 0.005,
    foregroundMaxChroma: 0.005,
  },
};
