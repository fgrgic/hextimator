import { useEffect, useMemo } from 'react';
import type { HextimatePaletteBuilder } from './HextimatePaletteBuilder';
import { hextimate } from './index';
import type { HextimateFormatOptions, HextimateGenerationOptions } from './types';

export interface UseHextimatorOptions {
	generation?: HextimateGenerationOptions;
	format?: Omit<HextimateFormatOptions, 'as'>;
	configure?: (builder: HextimatePaletteBuilder) => void;
}

export function useHextimator(color: string, options?: UseHextimatorOptions) {
	const palette = useMemo(() => {
		const builder = hextimate(color, options?.generation);
		options?.configure?.(builder);
		return builder.format({
			...options?.format,
			as: 'css',
		});
	}, [color, options?.generation, options?.format, options?.configure]);

	useEffect(() => {
		const entries = Object.entries(
			palette.light as Record<string, string>,
		);
		for (const [key, value] of entries) {
			document.documentElement.style.setProperty(key, value);
		}
		return () => {
			for (const [key] of entries) {
				document.documentElement.style.removeProperty(key);
			}
		};
	}, [palette]);
}
