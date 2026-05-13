export const DEFAULT_LIGHT_THEME_LIGHTNESS = 0.7;
export const DEFAULT_DARK_THEME_LIGHTNESS = 0.6;

/** Surface scale OKLCH L (`generateSurface`). Accent fills avoid this lightness band. */
export const SURFACE_SCALE = {
	light: { L: 0.97, strong: 0.02, weak: -0.03 },
	dark: { L: 0.2, strong: -0.1, weak: 0.1 },
} as const;
