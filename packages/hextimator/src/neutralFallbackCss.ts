import { hextimate } from './index';
import { buildStyleContent } from './react/css';

/** Middle gray so accent/surface scales read as neutral before the real brand color loads. */
export const FALLBACK_BRAND_COLOR = '#737373';

export function neutralFallbackCss(): string {
	const palette = hextimate(FALLBACK_BRAND_COLOR).format({ as: 'object' });
	const body = buildStyleContent(
		palette,
		{ type: 'media-or-class' },
		'',
		':root',
	);
	return `${body}\n`;
}
