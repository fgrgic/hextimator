import { type RefObject, useRef } from 'react';
import type { HextimatePaletteBuilder } from '../HextimatePaletteBuilder';
import type {
	HextimateFormatOptions,
	HextimateGenerationOptions,
} from '../types';
import type { DarkModeStrategy } from './types';

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
	target?: RefObject<HTMLElement | null>;
}

export function useStableOptions(options?: UseHextimatorOptions) {
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
