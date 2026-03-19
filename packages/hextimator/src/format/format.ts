import type { HextimatePalette } from '../generate/types';
import { buildTokenEntries } from './buildTokenEntries';
import {
	formatCSS,
	formatJSON,
	formatObject,
	formatSCSS,
	formatTailwind,
} from './formatters';
import type { FormatOptions, FormatResult } from './types';

export function format(
	palette: HextimatePalette,
	options?: FormatOptions,
): FormatResult {
	const entries = buildTokenEntries(palette, options);
	const sep = options?.separator ?? '-';

	switch (options?.as) {
		case 'css':
			return formatCSS(entries, sep);
		case 'scss':
			return formatSCSS(entries, sep);
		case 'tailwind':
			return formatTailwind(entries);
		case 'json':
			return formatJSON(entries, sep);
		default:
			return formatObject(entries, sep);
	}
}
