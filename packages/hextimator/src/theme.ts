import type {
	DerivedToken,
	TokenValue,
	VariantPlacement,
} from './HextimatePaletteBuilder';
import type {
	ColorInput,
	HextimateFormatOptions,
	HextimateStyleOptions,
} from './types';

export type RoleGenerator =
	| 'surface'
	| 'accent'
	| 'positive'
	| 'negative'
	| 'caution';

export type TokenGenerator = 'brand-exact' | 'brand-exact-foreground';

export type RoleDefinition =
	| { generate: RoleGenerator }
	| { color: ColorInput }
	| DerivedToken;

export type ThemeTokenValue = TokenValue | { generate: TokenGenerator };

/**
 * A palette structure that turns any accent into light and dark palettes.
 * Plain data, so it survives a JSON round trip.
 */
export interface ThemeDefinition {
	style?: HextimateStyleOptions;
	/** The key sets the output role name. */
	roles?: Record<string, RoleDefinition>;
	variants?: Array<{ name: string; placement: VariantPlacement }>;
	tokens?: Array<{ name: string; value: ThemeTokenValue }>;
	/** Renames variant suffixes in the output, such as `{ foreground: 'contrastText' }`. */
	variantNames?: Record<string, string>;
	/** Default output options. `.format()` options override them. */
	format?: HextimateFormatOptions;
}

export const baseTheme = {
	roles: {
		surface: { generate: 'surface' },
		accent: { generate: 'accent' },
		positive: { generate: 'positive' },
		negative: { generate: 'negative' },
		caution: { generate: 'caution' },
	},
	tokens: [
		{ name: 'brand-exact', value: { generate: 'brand-exact' } },
		{
			name: 'brand-exact-foreground',
			value: { generate: 'brand-exact-foreground' },
		},
	],
} satisfies ThemeDefinition;

export function isGeneratedRole(
	role: RoleDefinition,
): role is { generate: RoleGenerator } {
	return 'generate' in role;
}

export function isGeneratedToken(
	value: ThemeTokenValue,
): value is { generate: TokenGenerator } {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		'generate' in value
	);
}

/** Generated role names keyed by generator, in declaration order. */
export function generatedRoles(theme: ThemeDefinition) {
	return Object.entries(theme.roles ?? {}).flatMap(([name, role]) =>
		isGeneratedRole(role) ? [{ name, generate: role.generate }] : [],
	);
}
