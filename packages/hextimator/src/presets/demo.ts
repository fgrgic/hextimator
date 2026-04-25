import type { HextimatePreset } from './types';

/**
 * Demo preset that exercises every `HextimatePreset` capability:
 * style options, extra roles, extra variants, standalone tokens,
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
 * const theme = hextimate('#e63946')
 *   .style({ minContrastRatio: 'AAA' })
 *   .preset(presets.demo)
 *   .format({ colors: 'rgb' });
 */
export const demo: HextimatePreset = {
	style: {
		minContrastRatio: 'AA',
		surfaceHueShift: 180,
		surfaceMaxChroma: 0.025,
		hueShift: 10,
		light: { baseLightness: 0.55, maxChroma: 0.14 },
		dark: { baseLightness: 0.35, maxChroma: 0.12 },
	},

	roles: [
		{ name: 'cta', color: '#ff006e' },
		{ name: 'info', color: '#3a86ff' },
	],

	variants: [
		{ name: 'muted', placement: { from: 'weak' } },
		{ name: 'vivid', placement: { from: 'strong' } },
	],

	tokens: [
		{ name: 'canvas', value: { from: 'surface.weak' } },
		{ name: 'canvas-raised', value: { from: 'surface', emphasis: -0.04 } },
		{ name: 'border', value: { from: 'surface', emphasis: 0.1 } },
		{ name: 'border-subtle', value: { from: 'surface', emphasis: 0.05 } },
		{ name: 'ring', value: { from: 'accent' } },
		{ name: 'cta-ring', value: { from: 'cta', chroma: -0.05 } },
	],

	format: {
		as: 'css',
		colors: 'hex',
		roleNames: {
			surface: 'bg',
			accent: 'brand',
			positive: 'success',
			negative: 'danger',
		},
		variantNames: {
			foreground: 'text',
		},
	},
};
