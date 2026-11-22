import { baseTheme, type ThemeDefinition } from '../theme';
import type { HextimatePreset } from './types';

const variantNames = {
	DEFAULT: 'main',
	weak: 'light',
	strong: 'dark',
	foreground: 'contrastText',
};

const info = { color: '#0288d1' };
const secondary = { from: 'accent', hue: 180 };

const format = {
	as: 'object',
	colors: 'hex',
	separator: '-',
	roleNames: {
		accent: 'primary',
		negative: 'error',
		positive: 'success',
		caution: 'warning',
	},
	excludeRoles: ['surface'],
} satisfies NonNullable<ThemeDefinition['format']>;

const tokens: NonNullable<HextimatePreset['tokens']> = [
	// background
	{ name: 'background-default', value: { from: 'surface' } },
	{
		name: 'background-paper',
		value: { from: 'surface', emphasis: -0.025 },
	},

	// text
	{ name: 'text-primary', value: { from: 'surface.foreground' } },
	{
		name: 'text-secondary',
		value: { from: 'surface.foreground', emphasis: -0.2 },
	},
	{
		name: 'text-disabled',
		value: { from: 'surface.foreground', emphasis: -0.4 },
	},

	// divider
	{ name: 'divider', value: { from: 'surface', emphasis: 0.12 } },

	// action tokens
	{ name: 'action-hover', value: { from: 'surface', emphasis: 0.04 } },
	{ name: 'action-selected', value: { from: 'surface', emphasis: 0.08 } },
	{ name: 'action-disabled', value: { from: 'surface', emphasis: 0.15 } },
	{
		name: 'action-disabledBackground',
		value: { from: 'surface', emphasis: 0.06 },
	},
	{ name: 'action-focus', value: { from: 'surface', emphasis: 0.06 } },
];

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
		{ name: 'info', color: info.color },
		{ name: 'secondary', color: secondary },
	],
	tokens,
	format: { ...format, variantNames },
};

export const muiTheme = {
	...baseTheme,
	roles: { ...baseTheme.roles, info, secondary },
	tokens: [...baseTheme.tokens, ...tokens],
	variantNames,
	format,
} satisfies ThemeDefinition;
