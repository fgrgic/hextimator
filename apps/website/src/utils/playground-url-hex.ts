import { convertColor, parseColor } from 'hextimator';

/** Path segment for `https://playground.hextimator.com/<hex>` (no `#`). */
export function themeColorToPlaygroundPathHex(themeColor: string): string {
	try {
		const parsed = parseColor(themeColor);
		const { r, g, b } = convertColor(parsed, 'srgb');
		return [r, g, b]
			.map((channel) =>
				Math.max(0, Math.min(255, Math.round(channel)))
					.toString(16)
					.padStart(2, '0'),
			)
			.join('');
	} catch {
		const stripped = themeColor.replace(/^#/, '').trim();
		if (/^[0-9a-fA-F]{3,8}$/.test(stripped)) {
			return stripped.toLowerCase();
		}
		return 'ff6677';
	}
}
