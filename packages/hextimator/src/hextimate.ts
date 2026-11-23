import { HextimatePaletteBuilder } from './HextimatePaletteBuilder';
import { parse } from './parse';
import type { ThemeDefinition } from './theme';
import type { ColorInput } from './types';

/** Thrown when `hextimate()` fails to parse or generate a palette from the given input. */
export class HextimateError extends Error {
	constructor(
		public readonly input: ColorInput,
		message?: string,
	) {
		super(message ?? `Failed to hextimate color:  ${String(input)}`);
		this.name = 'HextimateError';
	}
}

/**
 * Creates a palette builder from an accent/brand color and an optional theme.
 * Without a theme it uses `baseTheme`.
 *
 * @example
 * const css = hextimate('#ff6600').format({ as: 'css' });
 *
 * @example
 * const theme = {
 *   ...baseTheme,
 *   style: { minContrastRatio: 'AA' },
 *   roles: { ...baseTheme.roles, cta: { color: '#ee2244' } },
 *   variants: [{ name: 'hover', placement: { from: 'strong' } }],
 * } satisfies ThemeDefinition;
 *
 * const css = hextimate('#ff6600', theme).format({ as: 'css' });
 */
export function hextimate(
	color: ColorInput,
	theme?: ThemeDefinition,
): HextimatePaletteBuilder {
	try {
		const parsedColor = parse(color);
		return new HextimatePaletteBuilder(parsedColor, theme);
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
