import type { RGB } from '../types';

const HEX_PATTERNS = {
	prefixed: /^#([0-9a-f]{3,8})$/, // e.g. #FF6666
	numeric: /^0x([0-9a-f]{6}|[0-9a-f]{8})$/, // e.g. 0xFF6666
	bare: /^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/, // e.g. F66, FF6666
};

function parseHexDigits(hex: string): RGB | null {
	// expand shorthand: ABC → AABBCC, ABCD → AABBCCDD
	if (hex.length === 3 || hex.length === 4) {
		hex = [...hex].map((c) => c + c).join('');
	}

	if (hex.length !== 6 && hex.length !== 8) {
		return null;
	}

	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);

	if ([r, g, b].some(Number.isNaN)) {
		return null;
	}

	return { space: 'srgb', r, g, b, alpha: 1 };
}

export function tryParseHex(input: string): RGB | null {
	for (const pattern of Object.values(HEX_PATTERNS)) {
		const match = input.match(pattern);
		if (match) {
			return parseHexDigits(match[1]);
		}
	}
	return null;
}
