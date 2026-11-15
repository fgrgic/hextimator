import { INK_ROLES } from '../generate/propertyColors';
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

			const roleName = options?.roleNames?.[role] ?? role;
			const kind = variant.startsWith('ink')
				? 'ink'
				: variant.startsWith('placeholder')
					? 'placeholder'
					: 'fill';
			const fillVariant =
				variant.replace(/^(ink|placeholder)-?/, '') || 'DEFAULT';
			const propertyAware =
				INK_ROLES.some((r) => r === role) && scale.ink !== undefined;
			const propertyUtility =
				propertyAware && ['DEFAULT', 'weak', 'strong'].includes(fillVariant)
					? ({
							kind,
							name:
								(options?.variantNames?.[fillVariant] ?? fillVariant) ===
								'DEFAULT'
									? roleName
									: `${roleName}${options?.separator ?? '-'}${options?.variantNames?.[fillVariant] ?? fillVariant}`,
						} as const)
					: undefined;
			entries.push({
				role: options?.roleNames?.[role] ?? role,
				variant: options?.variantNames?.[variant] ?? variant,
				isDefault: variant === 'DEFAULT',
				value: serializeColor(raw, colorFormat),
				...(propertyUtility ? { propertyUtility } : {}),
			});
		}
	}

	return entries;
}

/**
 * Returns a copy of `entry` whose flat key carries an `-inverted` suffix.
 * Used by `invertedVariants` to emit a contrast copy of every token.
 *
 * The suffix is joined to the variant using the current separator, so the
 * flat key for role `accent`, variant `strong` becomes `accent-strong-inverted`
 * (default sep) or `accent_strong_inverted` (sep `_`).
 *
 * For the DEFAULT variant the flat key collapses to `role-inverted`.
 */
export function withInvertedSuffix(entry: TokenEntry, sep: string): TokenEntry {
	const propertyUtility = entry.propertyUtility
		? {
				...entry.propertyUtility,
				name: `${entry.propertyUtility.name}${sep}inverted`,
			}
		: undefined;
	if (entry.isDefault && entry.variant === 'DEFAULT') {
		return { ...entry, isDefault: false, variant: 'inverted', propertyUtility };
	}
	return {
		...entry,
		variant: `${entry.variant}${sep}inverted`,
		propertyUtility,
	};
}
