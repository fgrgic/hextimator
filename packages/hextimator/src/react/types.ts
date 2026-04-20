export type DarkModeStrategy =
	| { type: 'class'; className?: string }
	| { type: 'data'; attribute?: string }
	| { type: 'media' }
	| { type: 'media-or-class'; className?: string }
	| false;

export type ModePreference = 'light' | 'dark' | 'system';
export type ResolvedMode = 'light' | 'dark';

/** A single color (used for both modes) or a per-mode pair. */
export type ColorInputProp = string | { light: string; dark: string };

/** A per-mode color pair. */
export interface ModeColors {
	light: string;
	dark: string;
}

export function normalizeColorProp(value: ColorInputProp): ModeColors {
	if (typeof value === 'string') {
		return { light: value, dark: value };
	}
	return { light: value.light, dark: value.dark };
}
