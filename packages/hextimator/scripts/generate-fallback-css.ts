import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { neutralFallbackCss } from '../src/neutralFallbackCss';

if (import.meta.main) {
	const out = join(import.meta.dirname, '..', 'fallback.css');
	writeFileSync(out, neutralFallbackCss(), 'utf8');
}
