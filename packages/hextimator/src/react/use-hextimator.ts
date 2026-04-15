import { useEffect, useMemo } from 'react';
import { hextimate } from '../index';
import { buildStyleContent, buildTargetedVars } from './css';
import {
	type UseHextimatorOptions,
	useStableOptions,
} from './use-stable-options';

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
