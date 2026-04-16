import {
	type CSSProperties,
	type ReactNode,
	useCallback,
	useContext,
	useId,
	useMemo,
	useState,
} from 'react';
import type { HextimatePaletteBuilder } from '../HextimatePaletteBuilder';
import { hextimate } from '../index';
import type { HextimatePreset } from '../presets/types';
import type {
	HextimateFormatOptions,
	HextimateGenerationOptions,
} from '../types';
import { HextimatorContext, type HextimatorContextValue } from './context';
import { buildStyleContent } from './css';
import { useOsPrefersDark } from './mode';
import type { DarkModeStrategy, ModePreference, ResolvedMode } from './types';
import { useStableOptions } from './use-stable-options';

/**
 * Props for `HextimatorScope`, a wrapper that creates a scoped theme for its
 * descendants via CSS cascade and React context.
 *
 * Unlike `HextimatorProvider` (which themes the whole document root),
 * `HextimatorScope` themes only its subtree. Scopes can nest freely, and the
 * nearest `HextimatorScope` or `HextimatorProvider` wins for
 * `useHextimatorTheme()`.
 *
 * Mode (light/dark) is inherited from the nearest parent context when present,
 * so a scope automatically follows the app's global dark-mode toggle. If you
 * pass `darkMode` explicitly, make sure it matches the strategy your root
 * `HextimatorProvider` uses (class, data, media, etc.) so the dark selectors
 * line up.
 */
export interface HextimatorScopeProps {
	defaultColor: string;
	generation?: HextimateGenerationOptions;
	presets?: HextimatePreset[];
	format?: Omit<HextimateFormatOptions, 'as'>;
	configure?: (builder: HextimatePaletteBuilder) => void;
	darkMode?: DarkModeStrategy;
	cssPrefix?: string;
	className?: string;
	style?: CSSProperties;
	children?: ReactNode;
}

/**
 * Scoped theme wrapper. Auto-generates a unique selector via `useId()`, wraps
 * children in a `<div data-hextimator-scope={id}>`, and emits a scoped
 * `<style>` with the generated palette. Also pushes a nested
 * `HextimatorContext` so `useHextimatorTheme()` called from inside the wrapper
 * returns the scope's palette and color state, not the root provider's.
 *
 * When nested inside a `HextimatorProvider` or another `HextimatorScope`, the
 * scope inherits all custom roles, variants, tokens, and presets from its
 * parent by forking the parent's builder — so you only pass the new color.
 * Any per-scope `configure` callback is applied on top of the inherited shape.
 *
 * @example
 * ```tsx
 * // Root provider defines the theme shape once
 * <HextimatorProvider
 *   defaultColor="#ff6600"
 *   darkMode={{ type: 'class' }}
 *   configure={(b) => b
 *     .addRole('cta', '#ff0066')
 *     .addVariant('hover', { from: 'strong' })
 *   }
 * >
 *   <App>
 *     // Scope inherits cta + hover, just swaps the base color
 *     <HextimatorScope defaultColor="#0066ff" darkMode={{ type: 'class' }}>
 *       <Card />
 *     </HextimatorScope>
 *   </App>
 * </HextimatorProvider>
 * ```
 */
export function HextimatorScope({
	defaultColor,
	generation: initialGeneration,
	presets: initialPresets,
	format: formatOpts,
	configure: initialConfigure,
	darkMode,
	cssPrefix,
	className,
	style,
	children,
}: HextimatorScopeProps) {
	const id = useId();
	const selector = `[data-hextimator-scope="${id}"]`;

	const [color, setColor] = useState(defaultColor);
	const [generation, setGeneration] = useState(initialGeneration);
	const [presets, setPresets] = useState(initialPresets);
	const [configure, setConfigureState] = useState<
		((builder: HextimatePaletteBuilder) => void) | undefined
	>(() => initialConfigure);

	const setConfigure = useCallback(
		(fn: ((builder: HextimatePaletteBuilder) => void) | undefined) => {
			setConfigureState(() => fn);
		},
		[],
	);

	const parent = useContext(HextimatorContext);

	const stable = useStableOptions({
		generation,
		presets,
		format: formatOpts,
		darkMode,
		cssPrefix,
	});

	const builder = useMemo(() => {
		const b = parent?.builder
			? parent.builder.fork(color, stable?.generation)
			: hextimate(color, stable?.generation);
		for (const p of presets ?? []) b.preset(p);
		configure?.(b);
		return b;
	}, [parent?.builder, color, presets, stable, configure]);

	const palette = useMemo(
		() =>
			builder.format({
				...stable?.format,
				as: 'css',
			}),
		[builder, stable],
	);

	const css = useMemo(
		() =>
			buildStyleContent(
				palette,
				stable?.darkMode ?? { type: 'media' },
				stable?.cssPrefix ?? '',
				selector,
			),
		[palette, stable, selector],
	);

	const osDark = useOsPrefersDark();

	const noopSetMode = useCallback(() => {}, []);
	const mode: ResolvedMode = parent?.mode ?? (osDark ? 'dark' : 'light');
	const modePreference: ModePreference = parent?.modePreference ?? 'system';
	const setMode = parent?.setMode ?? noopSetMode;

	const value = useMemo<HextimatorContextValue>(
		() => ({
			color,
			setColor,
			mode,
			modePreference,
			setMode,
			generation,
			setGeneration,
			presets,
			setPresets,
			configure,
			setConfigure,
			palette,
			builder,
		}),
		[
			color,
			mode,
			modePreference,
			setMode,
			generation,
			presets,
			configure,
			setConfigure,
			palette,
			builder,
		],
	);

	return (
		<HextimatorContext.Provider value={value}>
			<div data-hextimator-scope={id} className={className} style={style}>
				<style data-hextimator="">{css}</style>
				{children}
			</div>
		</HextimatorContext.Provider>
	);
}
