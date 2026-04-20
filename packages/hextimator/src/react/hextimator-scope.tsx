import {
	type CSSProperties,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
	useState,
} from 'react';
import type {
	HextimatePaletteBuilder,
	HextimateResult,
} from '../HextimatePaletteBuilder';
import { hextimate } from '../index';
import type { HextimatePreset } from '../presets/types';
import type { HextimateFormatOptions, HextimateStyleOptions } from '../types';
import { HextimatorContext, type HextimatorContextValue } from './context';
import { buildStyleContent } from './css';
import { useOsPrefersDark } from './mode';
import {
	type ColorInputProp,
	type DarkModeStrategy,
	type ModePreference,
	normalizeColorProp,
	type ResolvedMode,
} from './types';
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
	/** Seeds initial color state. String sets both modes equal; object sets each explicitly. */
	defaultColor: ColorInputProp;
	/**
	 * When true, builds from this scope's color and options only (via
	 * `hextimate`), without forking the parent builder. Use for previews or
	 * widgets where each scope must match exactly its presets and must not
	 * inherit parent roles, variants, or preset merges.
	 */
	isolated?: boolean;
	style?: HextimateStyleOptions;
	presets?: HextimatePreset[];
	format?: Omit<HextimateFormatOptions, 'as'>;
	configure?: (builder: HextimatePaletteBuilder) => void;
	darkMode?: DarkModeStrategy;
	cssPrefix?: string;
	className?: string;
	/** Inline styles for the scope wrapper element (not palette options; use `style` for those). */
	wrapperStyle?: CSSProperties;
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
	isolated = false,
	style: initialStyle,
	presets: initialPresets,
	format: formatOpts,
	configure: initialConfigure,
	darkMode,
	cssPrefix,
	className,
	wrapperStyle,
	children,
}: HextimatorScopeProps) {
	const id = useId();
	const selector = `[data-hextimator-scope="${id}"]`;

	const [lightColor, setLightColorState] = useState(
		() => normalizeColorProp(defaultColor).light,
	);
	const [darkColor, setDarkColorState] = useState(
		() => normalizeColorProp(defaultColor).dark,
	);
	const [style, setStyle] = useState(initialStyle);
	const [presets, setPresets] = useState(initialPresets);
	const [configure, setConfigureState] = useState<
		((builder: HextimatePaletteBuilder) => void) | undefined
	>(() => initialConfigure);

	useEffect(() => {
		const next = normalizeColorProp(defaultColor);
		setLightColorState(next.light);
		setDarkColorState(next.dark);
	}, [defaultColor]);

	const setLightColor = setLightColorState;
	const setDarkColor = setDarkColorState;
	const setColor = useCallback((c: string) => {
		setLightColorState(c);
		setDarkColorState(c);
	}, []);

	const setConfigure = useCallback(
		(fn: ((builder: HextimatePaletteBuilder) => void) | undefined) => {
			setConfigureState(() => fn);
		},
		[],
	);

	const parent = useContext(HextimatorContext);

	const stable = useStableOptions({
		style,
		presets,
		format: formatOpts,
		darkMode,
		cssPrefix,
	});

	const buildOne = useCallback(
		(c: string) => {
			const b =
				!isolated && parent?.builder ? parent.builder.fork(c) : hextimate(c);
			if (stable?.style && Object.keys(stable.style).length > 0) {
				b.style(stable.style);
			}
			for (const p of presets ?? []) b.preset(p);
			configure?.(b);
			return b;
		},
		[parent?.builder, isolated, stable?.style, presets, configure],
	);

	const lightBuilder = useMemo(
		() => buildOne(lightColor),
		[buildOne, lightColor],
	);
	const darkBuilder = useMemo(
		() => (lightColor === darkColor ? lightBuilder : buildOne(darkColor)),
		[buildOne, lightColor, darkColor, lightBuilder],
	);

	const palette = useMemo<HextimateResult>(() => {
		const lightResult = lightBuilder.format({
			...stable?.format,
			as: 'css',
		});
		if (darkBuilder === lightBuilder) return lightResult;
		const darkResult = darkBuilder.format({
			...stable?.format,
			as: 'css',
		});
		return { light: lightResult.light, dark: darkResult.dark };
	}, [lightBuilder, darkBuilder, stable?.format]);

	const css = useMemo(
		() =>
			buildStyleContent(
				palette,
				stable?.darkMode ?? { type: 'media' },
				stable?.cssPrefix ?? '',
				selector,
			),
		[palette, stable?.darkMode, stable?.cssPrefix, selector],
	);

	const osDark = useOsPrefersDark();

	const noopSetMode = useCallback(() => {}, []);
	const mode: ResolvedMode = parent?.mode ?? (osDark ? 'dark' : 'light');
	const modePreference: ModePreference = parent?.modePreference ?? 'system';
	const setMode = parent?.setMode ?? noopSetMode;

	const builder = mode === 'dark' ? darkBuilder : lightBuilder;
	const activeColor = mode === 'dark' ? darkColor : lightColor;

	const value = useMemo<HextimatorContextValue>(
		() => ({
			color: activeColor,
			setColor,
			lightColor,
			setLightColor,
			darkColor,
			setDarkColor,
			mode,
			modePreference,
			setMode,
			style,
			setStyle,
			presets,
			setPresets,
			configure,
			setConfigure,
			palette,
			builder,
		}),
		[
			activeColor,
			setColor,
			lightColor,
			darkColor,
			mode,
			modePreference,
			setMode,
			style,
			presets,
			configure,
			setConfigure,
			palette,
			builder,
		],
	);

	return (
		<HextimatorContext.Provider value={value}>
			<div
				data-hextimator-scope={id}
				className={className}
				style={wrapperStyle}
			>
				<style data-hextimator="">{css}</style>
				{children}
			</div>
		</HextimatorContext.Provider>
	);
}
