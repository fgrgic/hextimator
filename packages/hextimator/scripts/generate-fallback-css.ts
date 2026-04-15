import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hextimate } from '../src/index';
import { buildStyleContent } from '../src/react/css';

/** Middle gray so accent/base scales read as neutral before the real brand color loads. */
export const FALLBACK_BRAND_COLOR = '#737373';

const banner = `/**
 * Neutral placeholder theme for the pre-JavaScript paint (and before Hextimator injects CSS).
 * Same token names as default hextimate() + hextimator/tailwind.css. Dark mode matches
 * useHextimator / HextimatorStyle with darkMode: { type: "media-or-class" } (also fine for
 * { type: "media" } when :root has no .light class).
 *
 * Does not include tokens from presets (e.g. shadcn). For those, generate CSS with the CLI
 * and ship it alongside this file or instead of it.
 *
 * Regenerated at package build time (see package.json "build").
 */`;

export function neutralFallbackCss(): string {
	const palette = hextimate(FALLBACK_BRAND_COLOR).format({ as: 'css' });
	const body = buildStyleContent(
		palette,
		{ type: 'media-or-class' },
		'',
		':root',
	);
	return `${banner}\n\n${body}\n`;
}

if (import.meta.main) {
	const out = join(import.meta.dirname, '..', 'fallback.css');
	writeFileSync(out, neutralFallbackCss(), 'utf8');
}
