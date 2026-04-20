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
import type { FlatTokenMap } from '../format';
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

export interface HextimatorScopeProps {
	/** Brand color for this subtree. String sets the same color for both modes; object sets a different color for each mode. */
	defaultColor: ColorInputProp;
	/** When true, ignores any parent provider/scope and builds the theme from scratch. */
	isolated?: boolean;
	style?: HextimateStyleOptions;
	presets?: HextimatePreset[];
	format?: Omit<HextimateFormatOptions, 'as'>;
	configure?: (builder: HextimatePaletteBuilder) => void;
	darkMode?: DarkModeStrategy;
	cssPrefix?: string;
	className?: string;
	/** Inline styles for the wrapper `<div>`. */
	wrapperStyle?: CSSProperties;
	children?: ReactNode;
}

/**
 * Themes a single subtree with its own brand color. Inherits the shape (roles,
 * variants, presets) of any parent provider or scope unless `isolated` is set.
 *
 * @example
 * ```tsx
 * <HextimatorScope defaultColor="#0066ff">
 *   <Card />
 * </HextimatorScope>
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

	const palette = useMemo<HextimateResult<FlatTokenMap>>(() => {
		const lightResult = lightBuilder.format({
			...stable?.format,
			as: 'object',
		});
		if (darkBuilder === lightBuilder) return lightResult;
		const darkResult = darkBuilder.format({
			...stable?.format,
			as: 'object',
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
