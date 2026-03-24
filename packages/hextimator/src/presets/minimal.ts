import type { HextimatePreset } from './types';

/**
 * Framework-agnostic preset with clean, readable CSS custom property names.
 *
 * Maps hextimator's internal names to conventional UI token names:
 * `--background`, `--primary`, `--success`, `--danger`, `--warning`,
 * plus a standalone `--foreground` and `--border` token.
 *
 * Good starting point when you're not using a component library
 * and just want sensible CSS variables.
 *
 * @example
 * import { hextimate, presets } from 'hextimator';
 *
 * const theme = hextimate('#3a86ff')
 *   .preset(presets.minimal)
 *   .format();
 */
export const minimal: HextimatePreset = {
	tokens: [
		{
			name: 'border',
			value: {
				light: { from: 'base', lightness: -0.08 },
				dark: { from: 'base', lightness: +0.08 },
			},
		},
	],
	format: {
		as: 'css',
		colors: 'hex',
		roleNames: {
			base: 'background',
			accent: 'primary',
			positive: 'success',
			negative: 'danger',
		},
		variantNames: {
			foreground: 'foreground',
		},
	},
};
