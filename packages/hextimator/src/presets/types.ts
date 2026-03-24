import type { TokenValue, VariantPlacement } from '../HextimatePaletteBuilder';
import type { ColorInput, HextimateFormatOptions } from '../types';

/**
 * A reusable preset that configures the palette builder with
 * framework-specific roles, tokens, and format defaults.
 *
 * Presets are data-only objects — no circular dependencies, fully serializable.
 *
 * @example
 * import { hextimate, presets } from 'hextimator';
 *
 * const theme = hextimate('#6366F1')
 *   .preset(presets.shadcn)
 *   .format();
 */
export interface HextimatePreset {
	/** Extra roles to add to the palette (each generates DEFAULT, strong, weak, foreground variants). */
	roles?: Array<{ name: string; color: ColorInput }>;

	/** Extra variants to add across all roles. */
	variants?: Array<{ name: string; placement: VariantPlacement }>;

	/** Standalone tokens derived from existing palette values or explicit colors. */
	tokens?: Array<{ name: string; value: TokenValue }>;

	/** Default format options. Can be overridden in `.format()`. */
	format?: HextimateFormatOptions;
}
