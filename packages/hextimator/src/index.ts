import { HextimatePaletteBuilder } from './HextimatePaletteBuilder';
import { parse } from './parse';
import type { ColorInput, HextimateGenerationOptions } from './types';

export { convert as convertColor } from './convert';
export type { FlatTokenMap, FormatResult, NestedTokenMap } from './format';
export {
	type DerivedToken,
	HextimatePaletteBuilder,
	type HextimateResult,
	type TokenValue,
	type VariantPlacement,
} from './HextimatePaletteBuilder';
export { parse as parseColor } from './parse';
export type {
	HextimateFormatOptions,
	HextimateGenerationOptions,
	HextimateOptions,
} from './types';

class HextimateError extends Error {
	constructor(
		public readonly input: ColorInput,
		message?: string,
	) {
		super(message ?? `Failed to hextimate color:  ${String(input)}`);
		this.name = 'HextimateError';
	}
}

/**
 * Creates a palette builder from a base color.
 *
 * @example
 * // Two-step API: generate, then format
 * const theme = hextimate('#ff6600')
 *   .format({ as: 'css', colors: 'oklch' });
 *
 * @example
 * // Extended: add roles and variants before formatting
 * const theme = hextimate('#ff6600', { themeLightness: 0.7 })
 *   .addRole('cta', '#ee2244')
 *   .addVariant('hover', { beyond: 'strong' })
 *   .format({ as: 'tailwind' });
 */
export function hextimate(
	color: ColorInput,
	options?: HextimateGenerationOptions,
): HextimatePaletteBuilder {
	try {
		const parsedColor = parse(color);
		return new HextimatePaletteBuilder(parsedColor, options);
	} catch (e) {
		if (e instanceof HextimateError) {
			throw e;
		}
		throw new HextimateError(
			color,
			e instanceof Error ? e.message : 'Unknown error',
		);
	}
}
