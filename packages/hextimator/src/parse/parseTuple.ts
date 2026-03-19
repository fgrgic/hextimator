import type { Color, ColorSpace, ColorTuple } from '../types';

/**
 * Try to parse a color tuple into a Color.
 * e.g. [255, 102, 102] → { space: "srgb", r: 255, g: 102, b: 102, alpha: 1 }
 * @param input color tuple
 * @param assumeSpace color space to assume, defaults to "srgb"
 * @returns Color or null if parsing failed
 */
export function tryParseTuple(
	t: ColorTuple,
	assumeSpace: ColorSpace = 'srgb',
): Color | null {
	const [a, b, c] = t;

	switch (assumeSpace) {
		case 'srgb':
			return { space: 'srgb', r: a, g: b, b: c, alpha: 1 };
		case 'hsl':
			return { space: 'hsl', h: a, s: b, l: c, alpha: 1 };
		case 'oklch':
			return { space: 'oklch', l: a, c: b, h: c, alpha: 1 };
		case 'oklab':
			return { space: 'oklab', l: a, a: b, b: c, alpha: 1 };
		case 'linear-rgb':
			return { space: 'linear-rgb', r: a, g: b, b: c, alpha: 1 };
		default:
			return null;
	}
}
