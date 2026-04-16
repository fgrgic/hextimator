import type { HextimatePalette } from '../generate/types';
import { buildTokenEntries } from './buildTokenEntries';
import {
	formatCSS,
	formatJSON,
	formatObject,
	formatSCSS,
	formatTailwind,
	formatTailwindCSS,
} from './formatters';
import type { FormatOptions, FormatResult, TokenEntry } from './types';

/**
 *
 * Formats a Hextimate palette into the specified output format,
 * with options for customizing role/variant names and color formats.
 * Can also include standalone tokens that aren't part of the palette.
 *
 * @param palette The Hextimate palette to format, in the same format as the output of `hextimate()`.
 * @param options Formatting options, including:
 *   - `as`: The output format to use (e.g. "css", "scss", "tailwind", "json", or "object"). Default is "object".
 *   - `separator`: The separator to use between role and variant in token names. Default is "-".
 *   - `roleNames`: An optional mapping of role keys to custom role names to use in the output.
 *   - `variantNames`: An optional mapping of variant keys to custom variant names to use in the output.
 *   - `colors`: The color format to use for the output values (e.g. "hex", "rgb", "hsl"). Default is "hex".
 * @param standaloneTokens An optional array of additional token entries to include in the output, which are not derived from the palette.
 *    This can be used to add custom tokens that don't fit into the
 *    role/variant structure of the palette, or to override specific tokens with custom values.
 * @returns
 */
export function format(
	palette: HextimatePalette,
	options?: FormatOptions,
	standaloneTokens?: TokenEntry[],
): FormatResult {
	const entries = buildTokenEntries(palette, options);

	if (standaloneTokens) {
		entries.push(...standaloneTokens);
	}

	const sep = options?.separator ?? '-';

	switch (options?.as) {
		case 'css':
			return formatCSS(entries, sep);
		case 'scss':
			return formatSCSS(entries, sep);
		case 'tailwind':
			return formatTailwind(entries);
		case 'tailwind-css':
			return formatTailwindCSS(entries, sep);
		case 'json':
			return formatJSON(entries, sep);
		default:
			return formatObject(entries, sep);
	}
}
