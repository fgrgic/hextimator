import type { HextimatePalette } from '../generate/types';
import { buildTokenEntries } from './buildTokenEntries';
import {
	formatCSSStylesheet,
	formatJSON,
	formatObject,
	formatSCSS,
	formatTailwind,
	formatTailwindStylesheet,
} from './formatters';
import type { FormatOptions, FormatResult, TokenEntry } from './types';

/**
 * Formats a single palette into the chosen output shape.
 *
 * Used for per-palette formats that don't combine light + dark:
 * `object`, `tailwind`, `scss`, `json`. The stylesheet formats
 * (`css`, `tailwind-css`) go through `formatStylesheet` instead since
 * they wrap both palettes with a dark-mode selector.
 *
 * @param palette The palette to format.
 * @param options Format options (`as`, `separator`, `roleNames`, `variantNames`, `colors`, `excludeRoles`, `excludeVariants`).
 * @param standaloneTokens Extra token entries appended after palette-derived entries.
 */
export function format(
	palette: HextimatePalette,
	options?: FormatOptions,
	standaloneTokens?: TokenEntry[],
): FormatResult {
	const entries = buildTokenEntries(palette, options);
	if (standaloneTokens) entries.push(...standaloneTokens);

	const sep = options?.separator ?? '-';

	switch (options?.as) {
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

/**
 * Builds a ready-to-paste stylesheet from light + dark palettes.
 *
 * Returns a CSS string that wraps light tokens in the chosen selector and
 * dark tokens in the chosen dark-mode wrapper (`@media`, `.dark`, or
 * `[data-theme="dark"]`).
 */
export function formatStylesheet(
	lightPalette: HextimatePalette,
	darkPalette: HextimatePalette,
	options?: FormatOptions,
	lightStandalone?: TokenEntry[],
	darkStandalone?: TokenEntry[],
): string {
	const lightEntries = buildTokenEntries(lightPalette, options);
	if (lightStandalone) lightEntries.push(...lightStandalone);
	const darkEntries = buildTokenEntries(darkPalette, options);
	if (darkStandalone) darkEntries.push(...darkStandalone);

	const sep = options?.separator ?? '-';
	const stylesheetOpts = {
		selector: options?.selector,
		darkMode: options?.darkMode,
	};

	if (options?.as === 'tailwind-css') {
		return formatTailwindStylesheet(
			lightEntries,
			darkEntries,
			sep,
			stylesheetOpts,
		);
	}
	return formatCSSStylesheet(lightEntries, darkEntries, sep, stylesheetOpts);
}
