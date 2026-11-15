import { convert } from '../convert';
import { parse } from '../parse';
import type { Color, HextimateStyleOptions, OKLCH } from '../types';
import { resolveMergedThemeAdjustments } from './mergeThemeAdjustments';
import type { HextimatePalette, ThemeType } from './types';
import {
	CONTRAST_MARGIN,
	calculateContrast,
	resolveContrastRatio,
} from './utils';

export const INK_ROLES = ['accent', 'positive', 'negative', 'caution'] as const;
export const INK_VARIANTS = [
	'ink',
	'ink-weak',
	'ink-strong',
	'placeholder',
	'placeholder-weak',
	'placeholder-strong',
] as const;

function solveInk(
	base: OKLCH,
	surfaces: Color[],
	target: number,
	allowUnreachable: boolean,
): OKLCH {
	const contrast = (color: OKLCH) =>
		Math.min(...surfaces.map((surface) => calculateContrast(color, surface)));
	const dark = { ...base, l: 0, alpha: 1 };
	const light = { ...base, l: 1, alpha: 1 };
	const endpoint = contrast(dark) >= contrast(light) ? dark : light;
	if (contrast(endpoint) < target) {
		if (allowUnreachable) return convert(convert(endpoint, 'srgb'), 'oklch');
		throw new Error(
			`Surface backgrounds cannot support ${target}:1 semantic text contrast. Adjust the surface overrides or contrast target.`,
		);
	}
	const bufferedTarget = Math.min(target + CONTRAST_MARGIN, contrast(endpoint));
	let fail = endpoint.l === 0 ? 1 : 0;
	let pass = endpoint.l;
	for (let i = 0; i < 24; i++) {
		const mid = (fail + pass) / 2;
		if (contrast({ ...base, l: mid, alpha: 1 }) >= bufferedTarget) pass = mid;
		else fail = mid;
	}
	return convert(convert({ ...base, l: pass, alpha: 1 }, 'srgb'), 'oklch');
}

export function propertyColors(
	palette: HextimatePalette,
	theme: ThemeType,
	options: HextimateStyleOptions,
	allowUnreachable = false,
): HextimatePalette {
	if (options.propertyAware === false) return palette;
	const settings = resolveMergedThemeAdjustments(theme, options);
	const textTarget = resolveContrastRatio(settings.minContrastRatio);
	const placeholderTarget = resolveContrastRatio(
		settings.placeholderContrastRatio ?? 'AA',
	);
	const surfaces = ['DEFAULT', 'weak', 'strong'].map((variant) =>
		parse(palette.surface[variant]),
	);
	const result = { ...palette };
	for (const role of INK_ROLES) {
		if (!palette[role]) continue;
		const base = convert(parse(palette[role].DEFAULT), 'oklch');
		const weak = solveInk(base, surfaces, textTarget, allowUnreachable);
		const minimumContrast = (l: number) =>
			Math.min(
				...surfaces.map((surface) =>
					calculateContrast({ ...base, l, alpha: 1 }, surface),
				),
			);
		const endpoint = minimumContrast(0) >= minimumContrast(1) ? 0 : 1;
		const ink = { ...weak, l: weak.l + (endpoint - weak.l) * 0.12 };
		const strong = { ...weak, l: weak.l + (endpoint - weak.l) * 0.24 };
		const placeholderWeak = solveInk(
			base,
			surfaces,
			placeholderTarget,
			allowUnreachable,
		);
		result[role] = {
			...palette[role],
			'ink-weak': weak,
			ink,
			'ink-strong': strong,
			placeholder: {
				...placeholderWeak,
				l: placeholderWeak.l + (endpoint - placeholderWeak.l) * 0.06,
			},
			'placeholder-weak': placeholderWeak,
			'placeholder-strong': {
				...placeholderWeak,
				l: placeholderWeak.l + (endpoint - placeholderWeak.l) * 0.12,
			},
		};
	}
	return result;
}
