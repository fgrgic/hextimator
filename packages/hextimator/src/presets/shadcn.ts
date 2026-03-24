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
				light: { from: 'base.foreground', lightness: +0.25 },
				dark: { from: 'base.foreground', lightness: -0.25 },
			},
		},

		// accent (shadcn meaning: subtle hover highlight, not the brand color)
		{ name: 'accent', value: { from: 'base' } },
		{ name: 'accent-foreground', value: { from: 'base.foreground' } },

		// border / input
		{
			name: 'border',
			value: {
				light: { from: 'base', lightness: -0.08 },
				dark: { from: 'base', lightness: +0.08 },
			},
		},
		{
			name: 'input',
			value: {
				light: { from: 'base', lightness: -0.1 },
				dark: { from: 'base', lightness: +0.1 },
			},
		},

		// ring — uses the brand/primary color
		{ name: 'ring', value: { from: 'accent' } },
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
