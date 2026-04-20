import {
	type PropsWithChildren,
	type RefObject,
	useCallback,
	useEffect,
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
import { buildStyleContent, buildTargetedVars } from './css';
import { applyModeToDOM, useOsPrefersDark } from './mode';
import {
	type ColorInputProp,
	type DarkModeStrategy,
	type ModeColors,
	type ModePreference,
	normalizeColorProp,
	type ResolvedMode,
} from './types';
import { useStableOptions } from './use-stable-options';

/**
 * Props for the `HextimatorProvider` component, which manages the state of a Hextimator-generated color palette and injects corresponding CSS variables into the document.
 *
 * Controlled vs uncontrolled:
 * - `defaultColor` / `defaultMode` seed the internal state (uncontrolled).
 * - `color` / `modePreference` make the provider controlled — pass them along with
 *   `onColorChange` / `onModePreferenceChange` to own state externally (e.g. persist
 *   to localStorage).
 *
 * Per-mode colors:
 * - Pass a string to use the same color for both modes.
 * - Pass `{ light, dark }` to use different brand colors per mode. The provider
 *   generates both palettes and stitches the CSS so `@media (prefers-color-scheme: dark)`
 *   serves the dark-color palette regardless of the user's current selection.
 */
export interface HextimatorProviderProps {
	/** Seeds initial color state. String sets both modes equal; object sets each explicitly. */
	defaultColor: ColorInputProp;
	/** Controlled color. If provided, internal color state is ignored — pair with `onColorChange`. */
	color?: ColorInputProp;
	/** Fired when `setColor` / `setLightColor` / `setDarkColor` is called. Receives the next light+dark pair. */
	onColorChange?: (next: ModeColors) => void;
	defaultMode?: ModePreference;
	/** Controlled mode preference. If provided, internal mode state is ignored — pair with `onModePreferenceChange`. */
	modePreference?: ModePreference;
	onModePreferenceChange?: (mode: ModePreference) => void;
	style?: HextimateStyleOptions;
	presets?: HextimatePreset[];
	format?: Omit<HextimateFormatOptions, 'as'>;
	configure?: (builder: HextimatePaletteBuilder) => void;
	darkMode?: DarkModeStrategy;
	cssPrefix?: string;
	target?: RefObject<HTMLElement | null>;
}

/**
 * React context provider that manages a Hextimator-generated color palette and
 * injects corresponding CSS variables into the document.
 *
 * @example
 * ```tsx
 * <HextimatorProvider defaultColor="#ff6600" darkMode={{ type: 'class' }}>
 *   <App />
 * </HextimatorProvider>
 * ```
 *
 * @example
 * ```tsx
 * // Per-mode colors
 * <HextimatorProvider defaultColor={{ light: '#ff6600', dark: '#0088ff' }}>
 *   <App />
 * </HextimatorProvider>
 * ```
 *
 * @example
 * ```tsx
 * // Controlled — app owns persistence
 * const [colors, setColors] = useState(() => loadFromStorage());
 * return (
 *   <HextimatorProvider
 *     defaultColor="#ff6600"
 *     color={colors}
 *     onColorChange={(next) => { setColors(next); saveToStorage(next); }}
 *   >
 *     <App />
 *   </HextimatorProvider>
 * );
 * ```
 */
export function HextimatorProvider({
	children,
	defaultColor,
	color: controlledColor,
	onColorChange,
	defaultMode: initialMode = 'system',
	modePreference: controlledMode,
	onModePreferenceChange,
	style: initialStyle,
	presets: initialPresets,
	format: formatOpts,
	configure: initialConfigure,
	darkMode,
	cssPrefix,
	target,
}: PropsWithChildren<HextimatorProviderProps>) {
	const [internalLight, setInternalLight] = useState(
		() => normalizeColorProp(defaultColor).light,
	);
	const [internalDark, setInternalDark] = useState(
		() => normalizeColorProp(defaultColor).dark,
	);
	const [internalMode, setInternalMode] = useState<ModePreference>(initialMode);

	const [style, setStyle] = useState(initialStyle);
	const [presets, setPresets] = useState(initialPresets);
	const [configure, setConfigureState] = useState<
		((builder: HextimatePaletteBuilder) => void) | undefined
	>(() => initialConfigure);

	const isColorControlled = controlledColor !== undefined;
	const isModeControlled = controlledMode !== undefined;

	const activeColors: ModeColors = isColorControlled
		? normalizeColorProp(controlledColor as ColorInputProp)
		: { light: internalLight, dark: internalDark };

	const modePreference: ModePreference = isModeControlled
		? (controlledMode as ModePreference)
		: internalMode;

	const osDark = useOsPrefersDark();
	const mode: ResolvedMode =
		modePreference === 'system' ? (osDark ? 'dark' : 'light') : modePreference;

	const resolvedDarkMode = darkMode ?? { type: 'media' as const };

	useEffect(() => {
		applyModeToDOM(
			modePreference === 'system' ? null : modePreference,
			resolvedDarkMode,
		);
	}, [modePreference, resolvedDarkMode]);

	const emitColor = useCallback(
		(next: ModeColors) => {
			if (!isColorControlled) {
				setInternalLight(next.light);
				setInternalDark(next.dark);
			}
			onColorChange?.(next);
		},
		[isColorControlled, onColorChange],
	);

	const setColor = useCallback(
		(c: string) => emitColor({ light: c, dark: c }),
		[emitColor],
	);
	const setLightColor = useCallback(
		(c: string) => emitColor({ light: c, dark: activeColors.dark }),
		[emitColor, activeColors.dark],
	);
	const setDarkColor = useCallback(
		(c: string) => emitColor({ light: activeColors.light, dark: c }),
		[emitColor, activeColors.light],
	);

	const setMode = useCallback(
		(next: ModePreference) => {
			if (!isModeControlled) setInternalMode(next);
			onModePreferenceChange?.(next);
		},
		[isModeControlled, onModePreferenceChange],
	);

	const setConfigure = useCallback(
		(fn: ((builder: HextimatePaletteBuilder) => void) | undefined) => {
			setConfigureState(() => fn);
		},
		[],
	);

	const stable = useStableOptions({
		style,
		presets,
		format: formatOpts,
		darkMode,
		cssPrefix,
	});

	const buildOne = useCallback(
		(c: string) => {
			const b = hextimate(c);
			if (stable?.style && Object.keys(stable.style).length > 0) {
				b.style(stable.style);
			}
			for (const p of presets ?? []) b.preset(p);
			configure?.(b);
			return b;
		},
		[stable?.style, presets, configure],
	);

	const lightBuilder = useMemo(
		() => buildOne(activeColors.light),
		[buildOne, activeColors.light],
	);
	const darkBuilder = useMemo(
		() =>
			activeColors.light === activeColors.dark
				? lightBuilder
				: buildOne(activeColors.dark),
		[buildOne, activeColors.light, activeColors.dark, lightBuilder],
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

	useEffect(() => {
		const cssPrefixResolved = stable?.cssPrefix ?? '';
		const darkModeResolved = stable?.darkMode ?? { type: 'media' as const };
		const el = target?.current;

		if (el) {
			const vars = buildTargetedVars(
				palette,
				darkModeResolved,
				cssPrefixResolved,
			);
			for (const [key, value] of vars.light) {
				el.style.setProperty(key, value);
			}
			return () => {
				for (const [key] of vars.light) {
					el.style.removeProperty(key);
				}
			};
		}

		const styleEl = document.createElement('style');
		styleEl.setAttribute('data-hextimator', '');
		styleEl.textContent = buildStyleContent(
			palette,
			darkModeResolved,
			cssPrefixResolved,
		);
		document.head.appendChild(styleEl);
		return () => {
			document.head.removeChild(styleEl);
		};
	}, [palette, stable?.darkMode, stable?.cssPrefix, target]);

	const builder = mode === 'dark' ? darkBuilder : lightBuilder;

	const value = useMemo<HextimatorContextValue>(
		() => ({
			color: mode === 'dark' ? activeColors.dark : activeColors.light,
			setColor,
			lightColor: activeColors.light,
			setLightColor,
			darkColor: activeColors.dark,
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
			mode,
			activeColors.light,
			activeColors.dark,
			setColor,
			setLightColor,
			setDarkColor,
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
			{children}
		</HextimatorContext.Provider>
	);
}
