import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react';
import type {
	HextimatePaletteBuilder,
	HextimateResult,
} from './HextimatePaletteBuilder';
import { hextimate } from './index';
import type {
	HextimateFormatOptions,
	HextimateGenerationOptions,
} from './types';

type DarkModeStrategy =
	| { type: 'class'; className?: string }
	| { type: 'data'; attribute?: string }
	| { type: 'media' }
	| { type: 'media-or-class'; className?: string }
	| false;

/**
 * Options for the `useHextimator` hook, which generates a color palette and injects CSS variables based on a given color and configuration.
 * - `generation`: Options for how the palette is generated (e.g., light/dark settings, contrast requirements).
 * - `format`: Options for how the generated palette is formatted (e.g., output format).
 * - `configure`: A callback to further customize the palette builder before formatting.
 * - `darkMode`: Strategy for handling dark mode variants in CSS variable injection.
 * - `cssPrefix`: A prefix to apply to all generated CSS variable names.
 * - `target`: An optional ref to a specific DOM element where CSS variables should be injected instead of the document root.
 *
 */
export interface UseHextimatorOptions {
	generation?: HextimateGenerationOptions;
	format?: Omit<HextimateFormatOptions, 'as'>;
	configure?: (builder: HextimatePaletteBuilder) => void;
	darkMode?: DarkModeStrategy;
	cssPrefix?: string;
	target?: React.RefObject<HTMLElement | null>;
}

function buildStyleContent(
	palette: HextimateResult,
	darkMode: DarkModeStrategy,
	cssPrefix: string,
): string {
	const lightEntries = Object.entries(palette.light as Record<string, string>);
	const darkEntries = Object.entries(palette.dark as Record<string, string>);

	const toVars = (entries: [string, string][]) =>
		entries.map(([key, value]) => `${cssPrefix}${key}: ${value};`).join('\n  ');

	const lightVars = toVars(lightEntries);
	const darkVars = toVars(darkEntries);

	if (darkMode === false) {
		return `:root {\n  ${lightVars}\n}`;
	}

	if (darkMode.type === 'media') {
		return [
			`:root {\n  ${lightVars}\n}`,
			`@media (prefers-color-scheme: dark) {\n  :root {\n    ${darkVars}\n  }\n}`,
		].join('\n');
	}

	if (darkMode.type === 'media-or-class') {
		const cls = darkMode.className ?? 'dark';
		const lightCls = cls === 'dark' ? 'light' : `not-${cls}`;
		return [
			`:root {\n  ${lightVars}\n}`,
			`@media (prefers-color-scheme: dark) {\n  :root:not(.${lightCls}) {\n    ${darkVars}\n  }\n}`,
			`:root.${cls} {\n  ${darkVars}\n}`,
		].join('\n');
	}

	if (darkMode.type === 'class') {
		const cls = darkMode.className ?? 'dark';
		return [`:root {\n  ${lightVars}\n}`, `.${cls} {\n  ${darkVars}\n}`].join(
			'\n',
		);
	}

	const attr = darkMode.attribute ?? 'data-theme';
	return [
		`:root {\n  ${lightVars}\n}`,
		`[${attr}="dark"] {\n  ${darkVars}\n}`,
	].join('\n');
}

function buildTargetedVars(
	palette: HextimateResult,
	darkMode: DarkModeStrategy,
	cssPrefix: string,
): { light: [string, string][]; dark: [string, string][] } {
	const prefixEntries = (entries: [string, string][]) =>
		entries.map(
			([key, value]) => [`${cssPrefix}${key}`, value] as [string, string],
		);

	return {
		light: prefixEntries(
			Object.entries(palette.light as Record<string, string>),
		),
		dark:
			darkMode !== false
				? prefixEntries(Object.entries(palette.dark as Record<string, string>))
				: [],
	};
}

function useStableOptions(options?: UseHextimatorOptions) {
	const ref = useRef(options);
	const serialized = JSON.stringify({
		generation: options?.generation,
		format: options?.format,
		darkMode: options?.darkMode,
		cssPrefix: options?.cssPrefix,
	});

	if (
		serialized !==
		JSON.stringify({
			generation: ref.current?.generation,
			format: ref.current?.format,
			darkMode: ref.current?.darkMode,
			cssPrefix: ref.current?.cssPrefix,
		})
	) {
		ref.current = options;
	}

	return ref.current;
}

/**
 * Generates a color palette based on the provided color and options,
 * and injects CSS variables into the document for use in styling.
 * The palette is regenerated whenever the input color or relevant options change.
 *
 * Example usage:
 * ```tsx
 * const palette = useHextimator('#ff6600', {
 *   generation: { minContrastRatio: 'AA' },
 *   darkMode: { type: 'class', className: 'dark' },
 *   cssPrefix: '--myapp-',
 * });
 * ```
 *
 * @param color - The base color to generate the palette from.
 * @param options - Configuration options for palette generation, formatting, and CSS variable injection.
 */
export function useHextimator(color: string, options?: UseHextimatorOptions) {
	const stable = useStableOptions(options);
	const configure = options?.configure;
	const target = options?.target;

	const palette = useMemo(() => {
		const builder = hextimate(color, stable?.generation);
		configure?.(builder);
		return builder.format({
			...stable?.format,
			as: 'css',
		});
	}, [color, stable?.generation, stable?.format, configure]);

	const darkMode = stable?.darkMode ?? { type: 'media' as const };
	const cssPrefix = stable?.cssPrefix ?? '';

	useEffect(() => {
		const el = target?.current;

		if (el) {
			const vars = buildTargetedVars(palette, darkMode, cssPrefix);
			for (const [key, value] of vars.light) {
				el.style.setProperty(key, value);
			}
			return () => {
				for (const [key] of vars.light) {
					el.style.removeProperty(key);
				}
			};
		}

		const style = document.createElement('style');
		style.setAttribute('data-hextimator', '');
		style.textContent = buildStyleContent(palette, darkMode, cssPrefix);
		document.head.appendChild(style);
		return () => {
			document.head.removeChild(style);
		};
	}, [palette, darkMode, cssPrefix, target]);

	return palette;
}

// --- Dark mode detection ---

export type ModePreference = 'light' | 'dark' | 'system';
export type ResolvedMode = 'light' | 'dark';

const darkQuery =
	typeof window !== 'undefined'
		? window.matchMedia('(prefers-color-scheme: dark)')
		: null;

function useOsPrefersDark(): boolean {
	return useSyncExternalStore(
		(cb) => {
			if (!darkQuery) return () => {};
			darkQuery.addEventListener('change', cb);
			return () => darkQuery.removeEventListener('change', cb);
		},
		() => darkQuery?.matches ?? false,
		() => false,
	);
}

function applyModeToDOM(mode: ResolvedMode | null, darkMode: DarkModeStrategy) {
	if (typeof document === 'undefined') return;
	if (darkMode === false || darkMode.type === 'media') return;

	const root = document.documentElement;

	if (darkMode.type === 'data') {
		const attr = darkMode.attribute ?? 'data-theme';
		if (mode) {
			root.setAttribute(attr, mode);
		} else {
			root.removeAttribute(attr);
		}
		return;
	}

	// class or media-or-class
	const cls = darkMode.className ?? 'dark';
	const lightCls = cls === 'dark' ? 'light' : `not-${cls}`;
	root.classList.remove(cls, lightCls);
	if (mode) {
		root.classList.add(mode === 'dark' ? cls : lightCls);
	}
}

// --- Provider ---

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
	format?: Omit<HextimateFormatOptions, 'as'>;
	configure?: (builder: HextimatePaletteBuilder) => void;
	darkMode?: DarkModeStrategy;
	cssPrefix?: string;
	target?: React.RefObject<HTMLElement | null>;
}

export interface HextimatorContextValue {
	color: string;
	setColor: (color: string) => void;
	mode: ResolvedMode;
	modePreference: ModePreference;
	setMode: (mode: ModePreference) => void;
	generation: HextimateGenerationOptions | undefined;
	setGeneration: (opts: HextimateGenerationOptions | undefined) => void;
	configure: ((builder: HextimatePaletteBuilder) => void) | undefined;
	setConfigure: (
		fn: ((builder: HextimatePaletteBuilder) => void) | undefined,
	) => void;
	palette: HextimateResult;
}

const HextimatorContext = createContext<HextimatorContextValue | null>(null);

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
	format: formatOpts,
	configure: initialConfigure,
	darkMode,
	cssPrefix,
	target,
}: PropsWithChildren<HextimatorProviderProps>) {
	const [color, setColor] = useState(defaultColor);
	const [modePreference, setMode] = useState<ModePreference>(initialMode);
	const [generation, setGeneration] = useState(initialGeneration);
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
		format: formatOpts,
		configure,
		darkMode,
		cssPrefix,
		target,
	});

	const value = useMemo<HextimatorContextValue>(
		() => ({
			color,
			setColor,
			mode,
			modePreference,
			setMode,
			generation,
			setGeneration,
			configure,
			setConfigure,
			palette,
		}),
		[color, mode, modePreference, generation, configure, setConfigure, palette],
	);

	return (
		<HextimatorContext.Provider value={value}>
			{children}
		</HextimatorContext.Provider>
	);
}

/**
 * Provides access to the current Hextimator palette and theme state from the nearest `HextimatorProvider`.
 *
 * Returned properties:
 * - `color` / `setColor` — the current base color.
 * - `mode` — the resolved color mode (`'light'` or `'dark'`), accounting for OS preference when set to `'system'`.
 * - `modePreference` — the raw preference (`'light'`, `'dark'`, or `'system'`).
 * - `setMode` — update the mode preference. Pass `'system'` to follow the OS.
 * - `generation` / `setGeneration` — palette generation options.
 * - `configure` / `setConfigure` — builder configuration callback.
 * - `palette` — the generated `HextimateResult`.
 *
 * @example
 * ```tsx
 * const { mode, setMode } = useHextimatorTheme();
 *
 * <button onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
 *   Toggle dark mode
 * </button>
 * ```
 *
 * @throws If used outside of a `HextimatorProvider`.
 */
export function useHextimatorTheme(): HextimatorContextValue {
	const ctx = useContext(HextimatorContext);
	if (!ctx) {
		throw new Error(
			'useHextimatorTheme must be used within a <HextimatorProvider>',
		);
	}
	return ctx;
}
