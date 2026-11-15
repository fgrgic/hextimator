import { isInkRole, SURFACE_VARIANTS } from '../generate/propertyColors';
import type { HextimatePalette } from '../generate/types';
import type { Color, ColorInput } from '../types';
import { serializeColor } from './serializeColor';
import type { FormatOptions, TokenEntry } from './types';

function isColorObject(input: ColorInput): input is Color {
	return typeof input === 'object' && input !== null && 'space' in input;
}

/** Maps `ink-weak` to `{ kind: 'ink', name: 'negative-weak' }`, honoring role/variant renames. */
function propertyUtilityFor(
	role: string,
	variant: string,
	options?: FormatOptions,
): Pick<TokenEntry, 'propertyUtility'> | undefined {
	const kind = variant.startsWith('ink')
		? 'ink'
		: variant.startsWith('placeholder')
			? 'placeholder'
			: 'fill';
	const fillVariant = variant.replace(/^(ink|placeholder)-?/, '') || 'DEFAULT';
	if (!SURFACE_VARIANTS.includes(fillVariant)) return undefined;
	const roleName = options?.roleNames?.[role] ?? role;
	const variantName = options?.variantNames?.[fillVariant] ?? fillVariant;
	const name =
		variantName === 'DEFAULT'
			? roleName
			: `${roleName}${options?.separator ?? '-'}${variantName}`;
	return { propertyUtility: { kind, name } };
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
		const propertyAware = isInkRole(role) && scale.ink !== undefined;

		for (const variant of variants) {
			if (excludeVariants.has(variant)) continue;

			const raw = scale[variant];
			if (!isColorObject(raw)) continue;

			entries.push({
				role: options?.roleNames?.[role] ?? role,
				variant: options?.variantNames?.[variant] ?? variant,
				isDefault: variant === 'DEFAULT',
				value: serializeColor(raw, colorFormat),
				...(propertyAware && propertyUtilityFor(role, variant, options)),
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
	const suffix = `${sep}inverted`;
	const inverted: TokenEntry =
		entry.isDefault && entry.variant === 'DEFAULT'
			? { ...entry, isDefault: false, variant: 'inverted' }
			: { ...entry, variant: `${entry.variant}${suffix}` };
	if (entry.propertyUtility) {
		inverted.propertyUtility = {
			...entry.propertyUtility,
			name: `${entry.propertyUtility.name}${suffix}`,
		};
	}
	return inverted;
}
