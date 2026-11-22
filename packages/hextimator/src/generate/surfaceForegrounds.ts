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

export const FOREGROUND_ROLES = [
	'accent',
	'positive',
	'negative',
	'caution',
] as const;

const SURFACE_VARIANTS = ['DEFAULT', 'weak', 'strong'];

/** `foreground-negative` and the like, which `addToken('surface.foreground-negative', ...)` overrides. */
export function isRoleForeground(role: string, variant: string) {
	return (
		role === 'surface' &&
		FOREGROUND_ROLES.some((r) => variant === `foreground-${r}`)
	);
}

/**
 * Lowest-contrast lightness that meets the target on every surface, or the
 * strongest available contrast when the surfaces make the target unreachable.
 */
function solveContrast(base: OKLCH, surfaces: Color[], target: number): OKLCH {
	const withL = (l: number): OKLCH => ({ ...base, l, alpha: 1 });
	const contrast = (color: OKLCH) =>
		Math.min(...surfaces.map((surface) => calculateContrast(color, surface)));

	const endpointL = contrast(withL(0)) >= contrast(withL(1)) ? 0 : 1;
	const bufferedTarget = Math.min(
		target + CONTRAST_MARGIN,
		contrast(withL(endpointL)),
	);
	let fail = 1 - endpointL;
	let pass = endpointL;
	for (let i = 0; i < 24; i++) {
		const mid = (fail + pass) / 2;
		if (contrast(withL(mid)) >= bufferedTarget) pass = mid;
		else fail = mid;
	}
	return convert(convert(withL(pass), 'srgb'), 'oklch');
}

/**
 * Adds `surface.foreground-<role>`: text in the role's hue that meets
 * `minContrastRatio` on surface DEFAULT, weak, and strong.
 */
export function surfaceForegrounds(
	palette: HextimatePalette,
	theme: ThemeType,
	options: HextimateStyleOptions,
): HextimatePalette {
	const target = resolveContrastRatio(
		resolveMergedThemeAdjustments(theme, options).minContrastRatio,
	);
	const surfaces = SURFACE_VARIANTS.map((variant) =>
		parse(palette.surface[variant]),
	);
	const surface = { ...palette.surface };
	for (const role of FOREGROUND_ROLES) {
		if (!palette[role]) continue;
		surface[`foreground-${role}`] = solveContrast(
			convert(parse(palette[role].DEFAULT), 'oklch'),
			surfaces,
			target,
		);
	}
	return { ...palette, surface };
}
