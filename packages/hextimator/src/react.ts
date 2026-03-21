import { useEffect, useRef, useMemo } from 'react';
import type { HextimatePaletteBuilder, HextimateResult } from './HextimatePaletteBuilder';
import { hextimate } from './index';
import type { HextimateFormatOptions, HextimateGenerationOptions } from './types';

type DarkModeStrategy =
	| { type: 'class'; className?: string }
	| { type: 'data'; attribute?: string }
	| { type: 'media' }
	| false;

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

	if (darkMode.type === 'class') {
		const cls = darkMode.className ?? 'dark';
		return [
			`:root {\n  ${lightVars}\n}`,
			`.${cls} {\n  ${darkVars}\n}`,
		].join('\n');
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
		entries.map(([key, value]) => [`${cssPrefix}${key}`, value] as [string, string]);

	return {
		light: prefixEntries(Object.entries(palette.light as Record<string, string>)),
		dark: darkMode !== false
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

	if (serialized !== JSON.stringify({
		generation: ref.current?.generation,
		format: ref.current?.format,
		darkMode: ref.current?.darkMode,
		cssPrefix: ref.current?.cssPrefix,
	})) {
		ref.current = options;
	}

	return ref.current;
}

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
}
