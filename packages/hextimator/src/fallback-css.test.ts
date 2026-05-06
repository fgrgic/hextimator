import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { neutralFallbackCss } from './neutralFallbackCss';

describe('fallback.css', () => {
	it('matches generated neutral palette (bun run build regenerates fallback.css)', () => {
		const path = join(import.meta.dirname, '..', 'fallback.css');
		const onDisk = readFileSync(path, 'utf8');
		expect(onDisk).toBe(neutralFallbackCss());
	});
});
