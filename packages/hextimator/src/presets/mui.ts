import type { HextimatePreset } from './types';

/**
 * Preset for Material UI (MUI) projects.
 *
 * Generates palette tokens matching MUI's theme structure:
 * `primary`, `secondary`, `error`, `warning`, `info`, `success` —
 * each with `main`, `light`, `dark`, and `contrastText` variants.
 *
 * Also generates `background` (`default`, `paper`), `text` (`primary`,
 * `secondary`, `disabled`), `divider`, and `action` tokens.
 *
 * Defaults to `object` format for use with `createTheme()`. Override with
 * `.format({ as: 'css' })` for MUI's CSS variables mode.
 *
 * @example
 * import { hextimate, presets } from 'hextimator';
 * import { createTheme } from '@mui/material/styles';
 *
 * const palette = hextimate('#6366F1')
 *   .preset(presets.mui)
 *   .format();
 *
 * const theme = createTheme({ palette: palette.light });
 */
export const mui: HextimatePreset = {
	roles: [
		{ name: 'info', color: '#0288d1' },
		{ name: 'secondary', color: { from: 'accent', hue: 180 } },
	],
	tokens: [
		// background
		{ name: 'background-default', value: { from: 'base' } },
		{
			name: 'background-paper',
			value: { from: 'base', emphasis: -0.025 },
		},

		// text
		{ name: 'text-primary', value: { from: 'base.foreground' } },
		{
			name: 'text-secondary',
			value: { from: 'base.foreground', emphasis: -0.2 },
		},
		{
			name: 'text-disabled',
			value: { from: 'base.foreground', emphasis: -0.4 },
		},

		// divider
		{ name: 'divider', value: { from: 'base', emphasis: 0.12 } },

		// action tokens
		{ name: 'action-hover', value: { from: 'base', emphasis: 0.04 } },
		{ name: 'action-selected', value: { from: 'base', emphasis: 0.08 } },
		{ name: 'action-disabled', value: { from: 'base', emphasis: 0.15 } },
		{
			name: 'action-disabledBackground',
			value: { from: 'base', emphasis: 0.06 },
		},
		{ name: 'action-focus', value: { from: 'base', emphasis: 0.06 } },
	],
	format: {
		as: 'object',
		colors: 'hex',
		separator: '-',
		roleNames: {
			accent: 'primary',
			negative: 'error',
			positive: 'success',
		},
		variantNames: {
			DEFAULT: 'main',
			weak: 'light',
			strong: 'dark',
			foreground: 'contrastText',
		},
	},
};
