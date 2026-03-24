import type { HextimatePreset } from './types';

/**
 * Adds `strong` and `weak` variants to all roles.
 *
 * By default hextimator only generates `DEFAULT` and `foreground` per role.
 * This preset adds intensity variants for use cases that need hover states,
 * muted backgrounds, or other lightness variations.
 *
 * @example
 * import { hextimate, presets } from 'hextimator';
 *
 * const theme = hextimate('#6366F1')
 *   .preset(presets.minimal)
 *   .format({ as: 'css', colors: 'oklch' });
 */
export const minimal: HextimatePreset = {
	variants: [
		{ name: 'strong', placement: { side: 'strong' } },
		{ name: 'weak', placement: { side: 'weak' } },
	],
};
