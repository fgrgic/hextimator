import type { HextimatePalette } from '../generate/types';
import type { Color, ColorInput } from '../types';
import { serializeColor } from './serializeColor';
import type { FormatOptions, TokenEntry } from './types';

function isColorObject(input: ColorInput): input is Color {
	return typeof input === 'object' && input !== null && 'space' in input;
}

export function buildTokenEntries(
	palette: HextimatePalette,
	options?: FormatOptions,
): TokenEntry[] {
	const colorFormat = options?.colors ?? 'hex';
	const entries: TokenEntry[] = [];

	const excludeRoles = new Set(options?.excludeRoles ?? []);
	const excludeVariants = new Set(options?.excludeVariants ?? []);
	const roles = Object.keys(palette);

	for (const role of roles) {
		if (excludeRoles.has(role)) continue;

		const scale = palette[role];
		const variants = Object.keys(scale);

		for (const variant of variants) {
			if (excludeVariants.has(variant)) continue;

			const raw = scale[variant];
			if (!isColorObject(raw)) continue;

			entries.push({
				role: options?.roleNames?.[role] ?? role,
				variant: options?.variantNames?.[variant] ?? variant,
				isDefault: variant === 'DEFAULT',
				value: serializeColor(raw, colorFormat),
			});
		}
	}

	return entries;
}

/**
 * Returns a copy of `entry` whose flat key carries a `-light` or `-dark`
 * suffix. Used by `persistentVariants` to emit mode-locked tokens that
 * never change with the dark-mode wrapper.
 *
 * The suffix is joined to the variant using the current separator, so the
 * flat key for role `accent`, variant `strong`, suffix `light` becomes
 * `accent-strong-light` (default sep) or `accent_strong_light` (sep `_`).
 *
 * For the DEFAULT variant the flat key collapses to `role-suffix`.
 */
export function withModeSuffix(
	entry: TokenEntry,
	suffix: 'light' | 'dark',
	sep: string,
): TokenEntry {
	if (entry.isDefault && entry.variant === 'DEFAULT') {
		return { ...entry, isDefault: false, variant: suffix };
	}
	return { ...entry, variant: `${entry.variant}${sep}${suffix}` };
}
