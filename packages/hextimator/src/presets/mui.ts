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
	roles: [{ name: 'info', color: '#0288d1' }],
	tokens: [
		// secondary — desaturated version of primary
		{
			name: 'secondary-main',
			value: { from: 'accent', chroma: -0.06 },
		},
		{
			name: 'secondary-light',
			value: { from: 'accent.weak', chroma: -0.06 },
		},
		{
			name: 'secondary-dark',
			value: { from: 'accent.strong', chroma: -0.06 },
		},
		{
			name: 'secondary-contrastText',
			value: { from: 'accent.foreground' },
		},

		// background
		{ name: 'background-default', value: { from: 'base' } },
		{
			name: 'background-paper',
			value: {
				light: { from: 'base', lightness: +0.02 },
				dark: { from: 'base', lightness: +0.03 },
			},
		},

		// text
		{ name: 'text-primary', value: { from: 'base.foreground' } },
		{
			name: 'text-secondary',
			value: {
				light: { from: 'base.foreground', lightness: +0.2 },
				dark: { from: 'base.foreground', lightness: -0.2 },
			},
		},
		{
			name: 'text-disabled',
			value: {
				light: { from: 'base.foreground', lightness: +0.4 },
				dark: { from: 'base.foreground', lightness: -0.4 },
			},
		},

		// divider
		{
			name: 'divider',
			value: {
				light: { from: 'base', lightness: -0.12 },
				dark: { from: 'base', lightness: +0.12 },
			},
		},

		// action tokens
		{
			name: 'action-hover',
			value: {
				light: { from: 'base', lightness: -0.04 },
				dark: { from: 'base', lightness: +0.04 },
			},
		},
		{
			name: 'action-selected',
			value: {
				light: { from: 'base', lightness: -0.08 },
				dark: { from: 'base', lightness: +0.08 },
			},
		},
		{
			name: 'action-disabled',
			value: {
				light: { from: 'base', lightness: -0.15 },
				dark: { from: 'base', lightness: +0.15 },
			},
		},
		{
			name: 'action-disabledBackground',
			value: {
				light: { from: 'base', lightness: -0.06 },
				dark: { from: 'base', lightness: +0.06 },
			},
		},
		{
			name: 'action-focus',
			value: {
				light: { from: 'base', lightness: -0.06 },
				dark: { from: 'base', lightness: +0.06 },
			},
		},
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
