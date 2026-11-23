import { useMemo } from 'react';
import type { HextimatePaletteBuilder } from '../HextimatePaletteBuilder';
import { hextimate } from '../index';
import type { HextimatePreset } from '../presets/types';
import type { ThemeDefinition } from '../theme';
import type { HextimateFormatOptions, HextimateStyleOptions } from '../types';
import { buildStyleContent } from './css';
import type { DarkModeStrategy } from './types';
import { useStableOptions } from './use-stable-options';

/**
 * Props for the `HextimatorStyle` component, a declarative alternative to
 * `useHextimator` that renders a `<style>` element with the generated CSS
 * variables directly into React's tree.
 *
 * Unlike the hook, this works during SSR/RSC (no `useEffect`, no manual
 * cleanup), and supports scoping the palette to a specific selector so
 * multiple subtrees can carry different themes via CSS cascade.
 *
 * - `color`: The accent color to generate the palette from.
 * - `theme`: The `ThemeDefinition` to build with. Defaults to `baseTheme`.
 * - `format`: Options for how the generated palette is formatted.
 * - `configure`: A callback to further customize the palette builder after the theme is applied.
 * - `darkMode`: Strategy for handling dark mode variants.
 * - `cssPrefix`: A prefix applied to all generated CSS variable names.
 * - `selector`: CSS selector the variables are scoped to. Defaults to `:root`.
 */
export interface HextimatorStyleProps {
	color: string;
	theme?: ThemeDefinition;
	/** @deprecated Set `style` on the `theme`: `theme={{ ...baseTheme, style }}`. */
	style?: HextimateStyleOptions;
	/** @deprecated Pass a `theme` instead: `theme={themes.shadcn}`. */
	presets?: HextimatePreset[];
	format?: Omit<HextimateFormatOptions, 'as'>;
	configure?: (builder: HextimatePaletteBuilder) => void;
	darkMode?: DarkModeStrategy;
	cssPrefix?: string;
	selector?: string;
}

/**
 * Declarative alternative to `useHextimator`. Renders a `<style>` element
 * carrying the generated CSS variables, so the palette works during SSR/RSC
 * and can be scoped to any selector for per-subtree theming.
 *
 * @example
 * ```tsx
 * // Global theme (equivalent to the hook, but SSR-safe)
 * <HextimatorStyle color="#ff6600" darkMode={{ type: 'class' }} />
 *
 * // Per-subtree theme via CSS cascade
 * <div className="card-a">
 *   <HextimatorStyle color="#ff0066" selector=".card-a" />
 *   ...
 * </div>
 * ```
 */
export function HextimatorStyle({
	color,
	theme,
	style: styleOptions,
	presets,
	format: formatOpts,
	configure,
	darkMode,
	cssPrefix,
	selector,
}: HextimatorStyleProps) {
	const stable = useStableOptions({
		theme,
		style: styleOptions,
		presets,
		format: formatOpts,
		darkMode,
		cssPrefix,
	});

	const css = useMemo(() => {
		const builder = hextimate(color, stable?.theme);
		if (stable?.style && Object.keys(stable.style).length > 0) {
			builder.style(stable.style);
		}
		for (const p of stable?.presets ?? []) builder.preset(p);
		configure?.(builder);
		const palette = builder.format({
			...stable?.format,
			as: 'object',
		});
		return buildStyleContent(
			palette,
			stable?.darkMode ?? { type: 'media' },
			stable?.cssPrefix ?? '',
			selector,
		);
	}, [color, stable, configure, selector]);

	return <style data-hextimator="">{css}</style>;
}
