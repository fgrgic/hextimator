import type { HextimatePreset } from './types';

/**
 * Demo preset that exercises every `HextimatePreset` capability:
 * generation options, extra roles, extra variants, standalone tokens,
 * and format defaults.
 *
 * Use this as a reference when building your own presets.
 *
 * @example
 * import { hextimate, presets } from 'hextimator';
 *
 * const theme = hextimate('#e63946').preset(presets.demo).format();
 *
 * // Override any preset default:
 * const theme = hextimate('#e63946', { minContrastRatio: 'AAA' })
 *   .preset(presets.demo)
 *   .format({ colors: 'rgb' });
 */
export const demo: HextimatePreset = {
	generation: {
		minContrastRatio: 'AA',
		baseHueShift: 180,
		baseMaxChroma: 0.025,
		hueShift: 10,
		light: { lightness: 0.55, maxChroma: 0.14 },
		dark: { lightness: 0.35, maxChroma: 0.12 },
	},

	roles: [
		{ name: 'cta', color: '#ff006e' },
		{ name: 'info', color: '#3a86ff' },
	],

	variants: [
		{ name: 'muted', placement: { beyond: 'weak' } },
		{ name: 'vivid', placement: { beyond: 'strong' } },
	],

	tokens: [
		{ name: 'surface', value: { from: 'base.weak' } },
		{
			name: 'surface-raised',
			value: {
				light: { from: 'base', lightness: +0.03 },
				dark: { from: 'base', lightness: +0.05 },
			},
		},
		{
			name: 'border',
			value: {
				light: { from: 'base', lightness: -0.1 },
				dark: { from: 'base', lightness: +0.1 },
			},
		},
		{
			name: 'border-subtle',
			value: {
				light: { from: 'base', lightness: -0.05 },
				dark: { from: 'base', lightness: +0.05 },
			},
		},
		{ name: 'ring', value: { from: 'accent' } },
		{ name: 'cta-ring', value: { from: 'cta', chroma: -0.05 } },
	],

	format: {
		as: 'css',
		colors: 'hex',
		roleNames: {
			base: 'bg',
			accent: 'brand',
			positive: 'success',
			negative: 'danger',
		},
		variantNames: {
			foreground: 'text',
		},
	},
};
