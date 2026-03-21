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
