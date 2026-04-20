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

export interface HextimatorProviderProps {
	/** Brand color. String sets the same color for both modes; object sets a different color for each mode. */
	defaultColor: ColorInputProp;
	/** Called when the color changes. */
	onColorChange?: (next: ModeColors) => void;
	/** Initial mode. Defaults to `'system'`. */
	defaultMode?: ModePreference;
	/** Called when the mode changes. */
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
 * Provides a hextimator theme to its children.
 *
 * @example
 * ```tsx
 * <HextimatorProvider defaultColor="#ff6600">
 *   <App />
 * </HextimatorProvider>
 * ```
 */
export function HextimatorProvider({
	children,
	defaultColor,
	onColorChange,
	defaultMode: initialMode = 'system',
	onModePreferenceChange,
	style: initialStyle,
	presets: initialPresets,
	format: formatOpts,
	configure: initialConfigure,
	darkMode,
	cssPrefix,
	target,
}: PropsWithChildren<HextimatorProviderProps>) {
	const [lightColor, setLightColorState] = useState(
		() => normalizeColorProp(defaultColor).light,
	);
	const [darkColor, setDarkColorState] = useState(
		() => normalizeColorProp(defaultColor).dark,
	);
	const [modePreference, setModePreferenceState] =
		useState<ModePreference>(initialMode);

	const [style, setStyle] = useState(initialStyle);
	const [presets, setPresets] = useState(initialPresets);
	const [configure, setConfigureState] = useState<
		((builder: HextimatePaletteBuilder) => void) | undefined
	>(() => initialConfigure);

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

	const setColor = useCallback(
		(c: string) => {
			setLightColorState(c);
			setDarkColorState(c);
			onColorChange?.({ light: c, dark: c });
		},
		[onColorChange],
	);
	const setLightColor = useCallback(
		(c: string) => {
			setLightColorState(c);
			onColorChange?.({ light: c, dark: darkColor });
		},
		[darkColor, onColorChange],
	);
	const setDarkColor = useCallback(
		(c: string) => {
			setDarkColorState(c);
			onColorChange?.({ light: lightColor, dark: c });
		},
		[lightColor, onColorChange],
	);

	const setMode = useCallback(
		(next: ModePreference) => {
			setModePreferenceState(next);
			onModePreferenceChange?.(next);
		},
		[onModePreferenceChange],
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
			color: mode === 'dark' ? darkColor : lightColor,
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
			mode,
			lightColor,
			darkColor,
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
