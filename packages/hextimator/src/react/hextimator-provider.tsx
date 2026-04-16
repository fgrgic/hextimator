import {
	type PropsWithChildren,
	type RefObject,
	useCallback,
	useEffect,
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
import { applyModeToDOM, useOsPrefersDark } from './mode';
import type { DarkModeStrategy, ModePreference, ResolvedMode } from './types';
import { useHextimator } from './use-hextimator';

/**
 * Props for the `HextimatorProvider` component, which manages the state of a Hextimator-generated color palette and injects corresponding CSS variables into the document.
 * - `defaultColor`: The initial base color to generate the palette from.
 * - `generation`: Initial options for how the palette is generated (e.g., light/dark settings, contrast requirements).
 * - `format`: Initial options for how the generated palette is formatted (e.g., output format).
 * - `configure`: An initial callback to further customize the palette builder before formatting.
 * - `darkMode`: Strategy for handling dark mode variants in CSS variable injection.
 * - `cssPrefix`: A prefix to apply to all generated CSS variable names.
 * - `target`: An optional ref to a specific DOM element where CSS variables should be injected instead of the document root.
 */
export interface HextimatorProviderProps {
	defaultColor: string;
	defaultMode?: ModePreference;
	generation?: HextimateGenerationOptions;
	presets?: HextimatePreset[];
	format?: Omit<HextimateFormatOptions, 'as'>;
	configure?: (builder: HextimatePaletteBuilder) => void;
	darkMode?: DarkModeStrategy;
	cssPrefix?: string;
	target?: RefObject<HTMLElement | null>;
}

/**
 *
 * A React context provider that manages the state of
 * a Hextimator-generated color palette and injects corresponding CSS variables into the document.
 * It allows child components to access and update the
 * base color, generation options, and configuration callback, automatically
 * regenerating the palette and updating CSS variables as needed.

 * The Provider accepts props for the default color, generation options, formatting options,
 * dark mode strategy, CSS variable prefix, and an optional target element for CSS variable injection.
 * It uses the `useHextimator` hook to generate the palette and handles the injection of CSS variables based on the current state.
 *
 * Example usage:
 * ```tsx
 * <HextimatorProvider defaultColor="#ff6600" generation={{ minContrastRatio: 'AA' }} darkMode={{ type: 'class', className: 'dark' }} cssPrefix="--myapp-">
 *  <App />
 * </HextimatorProvider>
 * ```
 */
export function HextimatorProvider({
	children,
	defaultColor,
	defaultMode: initialMode = 'system',
	generation: initialGeneration,
	presets: initialPresets,
	format: formatOpts,
	configure: initialConfigure,
	darkMode,
	cssPrefix,
	target,
}: PropsWithChildren<HextimatorProviderProps>) {
	const [color, setColor] = useState(defaultColor);
	const [modePreference, setMode] = useState<ModePreference>(initialMode);
	const [generation, setGeneration] = useState(initialGeneration);
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

	const setConfigure = useCallback(
		(fn: ((builder: HextimatePaletteBuilder) => void) | undefined) => {
			setConfigureState(() => fn);
		},
		[],
	);

	const palette = useHextimator(color, {
		generation,
		presets,
		format: formatOpts,
		configure,
		darkMode,
		cssPrefix,
		target,
	});

	const builder = useMemo(() => {
		const b = hextimate(color, generation);
		for (const p of presets ?? []) b.preset(p);
		configure?.(b);
		return b;
	}, [color, generation, presets, configure]);

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
			{children}
		</HextimatorContext.Provider>
	);
}
