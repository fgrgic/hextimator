import type { HextimatePreset } from './types';

/**
 * Preset for shadcn/ui projects.
 *
 * Generates all CSS variables that shadcn/ui components expect:
 * `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`,
 * `--accent`, `--destructive`, `--card`, `--popover`, `--border`, `--input`, `--ring`,
 * plus their `-foreground` counterparts.
 *
 * Also includes hextimator's bonus scale variants (`--primary-strong`, `--primary-weak`, etc.)
 * which you can optionally use beyond what shadcn requires.
 *
 * Defaults to `oklch` color format (modern shadcn). Override with
 * `.format({ colors: 'hsl-raw' })` for older shadcn setups.
 *
 * @example
 * import { hextimate, presets } from 'hextimator';
 *
 * const theme = hextimate('#6366F1')
 *   .preset(presets.shadcn)
 *   .format();
 *
 * // Use with React hook:
 * const palette = useHextimator('#6366F1', {
 *   configure: (b) => b.preset(presets.shadcn),
 * });
 */
export const shadcn: HextimatePreset = {
	tokens: [
		// shadcn uses bare --foreground (not --background-foreground)
		{ name: 'foreground', value: { from: 'base.foreground' } },

		// card / popover — same as background
		{ name: 'card', value: { from: 'base' } },
		{ name: 'card-foreground', value: { from: 'base.foreground' } },
		{ name: 'popover', value: { from: 'base' } },
		{ name: 'popover-foreground', value: { from: 'base.foreground' } },

		// secondary — subtle contrast from background
		{ name: 'secondary', value: { from: 'base' } },
		{ name: 'secondary-foreground', value: { from: 'base.foreground' } },

		// muted — similar to secondary, but with dimmer foreground
		{ name: 'muted', value: { from: 'base' } },
		{
			name: 'muted-foreground',
			value: {
				from: 'base.foreground',
				emphasis: -0.25,
			},
		},

		// accent (shadcn meaning: subtle hover highlight, not the brand color)
		{ name: 'accent', value: { from: 'base' } },
		{ name: 'accent-foreground', value: { from: 'base.foreground' } },

		// border / input
		{
			name: 'border',
			value: { from: 'base', emphasis: +0.8 },
		},
		{
			name: 'input',
			value: {
				from: 'base',
				emphasis: +0.8,
			},
		},

		// ring — uses the brand/primary color
		{ name: 'ring', value: { from: 'accent' } },

		// chart tokens colors use brand/priamry color
		{ name: 'chart-1', value: { from: 'accent' } },
		{ name: 'chart-2', value: { from: 'chart-1', emphasis: -0.04 } },
		{ name: 'chart-3', value: { from: 'chart-2', emphasis: -0.04 } },
		{ name: 'chart-4', value: { from: 'chart-3', emphasis: -0.04 } },
		{ name: 'chart-5', value: { from: 'chart-4', emphasis: -0.04 } },
	],
	format: {
		as: 'css',
		colors: 'oklch',
		roleNames: {
			base: 'background',
			accent: 'primary',
			negative: 'destructive',
			positive: 'success',
		},
		variantNames: {
			foreground: 'foreground',
		},
	},
};
