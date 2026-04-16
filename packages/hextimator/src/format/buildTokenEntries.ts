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
