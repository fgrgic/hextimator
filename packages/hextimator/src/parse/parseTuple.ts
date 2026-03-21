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
	switch (assumeSpace) {
		case 'srgb': {
			const [r, g, b] = t;
			return { space: 'srgb', r, g, b, alpha: 1 };
		}
		case 'hsl': {
			const [h, s, l] = t;
			return { space: 'hsl', h, s, l, alpha: 1 };
		}
		case 'oklch': {
			const [l, c, h] = t;
			return { space: 'oklch', l, c, h, alpha: 1 };
		}
		case 'oklab': {
			const [l, a, b] = t;
			return { space: 'oklab', l, a, b, alpha: 1 };
		}
		case 'linear-rgb': {
			const [r, g, b] = t;
			return { space: 'linear-rgb', r, g, b, alpha: 1 };
		}
		default:
			return null;
	}
}
