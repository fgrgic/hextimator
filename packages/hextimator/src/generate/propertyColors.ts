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
export const SURFACE_VARIANTS = ['DEFAULT', 'weak', 'strong'];

const INK_STEP = 0.12;
const PLACEHOLDER_STEP = 0.06;

export function isInkRole(role: string): boolean {
	return (INK_ROLES as readonly string[]).includes(role);
}

/**
 * Weak meets the target, or gets the strongest available contrast when the
 * surfaces make the target unreachable. DEFAULT and strong step toward the endpoint.
 */
function solveScale(
	base: OKLCH,
	surfaces: Color[],
	target: number,
	step: number,
): [weak: OKLCH, DEFAULT: OKLCH, strong: OKLCH] {
	const withL = (l: number): OKLCH => ({ ...base, l, alpha: 1 });
	const contrast = (color: OKLCH) =>
		Math.min(...surfaces.map((surface) => calculateContrast(color, surface)));
	const toGamut = (color: OKLCH) => convert(convert(color, 'srgb'), 'oklch');

	const endpointL = contrast(withL(0)) >= contrast(withL(1)) ? 0 : 1;
	const maxContrast = contrast(withL(endpointL));
	const bufferedTarget = Math.min(target + CONTRAST_MARGIN, maxContrast);
	let fail = 1 - endpointL;
	let pass = endpointL;
	for (let i = 0; i < 24; i++) {
		const mid = (fail + pass) / 2;
		if (contrast(withL(mid)) >= bufferedTarget) pass = mid;
		else fail = mid;
	}
	const weak = toGamut(withL(pass));
	const towardEndpoint = (t: number): OKLCH => ({
		...weak,
		l: weak.l + (endpointL - weak.l) * t,
	});
	return [weak, towardEndpoint(step), towardEndpoint(step * 2)];
}

export function propertyColors(
	palette: HextimatePalette,
	theme: ThemeType,
	options: HextimateStyleOptions,
): HextimatePalette {
	if (options.propertyAware === false) return palette;
	const settings = resolveMergedThemeAdjustments(theme, options);
	const textTarget = resolveContrastRatio(settings.minContrastRatio);
	const placeholderTarget = resolveContrastRatio(
		settings.placeholderContrastRatio ?? 'AA',
	);
	const surfaces = SURFACE_VARIANTS.map((variant) =>
		parse(palette.surface[variant]),
	);
	const result = { ...palette };
	for (const role of INK_ROLES) {
		if (!palette[role]) continue;
		const base = convert(parse(palette[role].DEFAULT), 'oklch');
		const [inkWeak, ink, inkStrong] = solveScale(
			base,
			surfaces,
			textTarget,
			INK_STEP,
		);
		const [placeholderWeak, placeholder, placeholderStrong] = solveScale(
			base,
			surfaces,
			placeholderTarget,
			PLACEHOLDER_STEP,
		);
		result[role] = {
			...palette[role],
			'ink-weak': inkWeak,
			ink,
			'ink-strong': inkStrong,
			placeholder,
			'placeholder-weak': placeholderWeak,
			'placeholder-strong': placeholderStrong,
		};
	}
	return result;
}
