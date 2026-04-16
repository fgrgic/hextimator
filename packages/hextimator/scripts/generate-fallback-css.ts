import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hextimate } from '../src/index';
import { buildStyleContent } from '../src/react/css';

/** Middle gray so accent/base scales read as neutral before the real brand color loads. */
export const FALLBACK_BRAND_COLOR = '#737373';

export function neutralFallbackCss(): string {
  const palette = hextimate(FALLBACK_BRAND_COLOR).format({ as: 'css' });
  const body = buildStyleContent(
    palette,
    { type: 'media-or-class' },
    '',
    ':root',
  );
  return `${body}\n`;
}

if (import.meta.main) {
  const out = join(import.meta.dirname, '..', 'fallback.css');
  writeFileSync(out, neutralFallbackCss(), 'utf8');
}
