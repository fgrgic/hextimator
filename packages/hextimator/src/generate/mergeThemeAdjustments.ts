import type { HextimateStyleOptions, ThemeAdjustments } from '../types';
import type { GenerateOptions, ThemeType } from './types';

/** Style fields at top level (defaults for both themes), excluding branches and flags. */
export function extractGlobalThemeAdjustments(
	options: HextimateStyleOptions & { inputLightness?: number },
): ThemeAdjustments {
	const {
		light: _l,
		dark: _d,
		invertDarkModeSurfaceAccent: _i,
		inputLightness: _inp,
		...global
	} = options;
	return global;
}

export function mergeThemeAdjustments(
	base: ThemeAdjustments,
	override: ThemeAdjustments | undefined,
): ThemeAdjustments {
	if (!override) return { ...base };
	return {
		...base,
		...override,
		semanticColors:
			base.semanticColors || override.semanticColors
				? {
						...base.semanticColors,
						...override.semanticColors,
					}
				: undefined,
		semanticColorRanges:
			base.semanticColorRanges || override.semanticColorRanges
				? {
						...base.semanticColorRanges,
						...override.semanticColorRanges,
					}
				: undefined,
	};
}

/** Single object for `themeType`: top-level defaults shallow-merged with `light` or `dark`. */
export function resolveMergedThemeAdjustments(
	themeType: ThemeType,
	options: GenerateOptions | HextimateStyleOptions,
): ThemeAdjustments {
	const global = extractGlobalThemeAdjustments(
		options as HextimateStyleOptions & { inputLightness?: number },
	);
	const branch = themeType === 'light' ? options.light : options.dark;
	return mergeThemeAdjustments(global, branch);
}

/**
 * Copy of `options` whose active `light` or `dark` entry is already merged with top-level theme fields.
 * Downstream code can keep using `themeType === 'light' ? options.light : options.dark`.
 */
export function withMergedThemeBranch<
	O extends HextimateStyleOptions & { inputLightness?: number },
>(options: O | undefined, themeType: ThemeType): O {
	const base = options ?? ({} as O);
	const themeAdjustments = resolveMergedThemeAdjustments(
		themeType,
		base as GenerateOptions | HextimateStyleOptions,
	);
	if (themeType === 'light') {
		return { ...base, light: themeAdjustments };
	}
	return { ...base, dark: themeAdjustments };
}
