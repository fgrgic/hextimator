import { describe, expect, it } from 'bun:test';
import { hextimate } from '../index';

describe('audit() — per-token contrast report', () => {
	it('reports passing AAA ratios for a normal palette', () => {
		const report = hextimate('#3b82f6').audit();

		expect(report.light.length).toBeGreaterThan(0);
		expect(report.dark.length).toBeGreaterThan(0);
		expect(report.light.every((t) => t.passesAA)).toBe(true);
		expect(report.light.every((t) => t.passesAAA)).toBe(true);
		expect(report.dark.every((t) => t.passesAAA)).toBe(true);
	});

	it('pairs fill variants against their scale foreground', () => {
		const { light } = hextimate('#3b82f6').audit();

		const accent = light.find((t) => t.token === 'accent');
		const accentStrong = light.find((t) => t.token === 'accent-strong');
		const accentWeak = light.find((t) => t.token === 'accent-weak');

		expect(accent?.pairedAgainst).toBe('accent-foreground');
		expect(accentStrong?.pairedAgainst).toBe('accent-foreground');
		expect(accentWeak?.pairedAgainst).toBe('accent-foreground');
	});

	it('pairs the foreground variant against its scale DEFAULT fill', () => {
		const { light } = hextimate('#3b82f6').audit();

		const accentFg = light.find((t) => t.token === 'accent-foreground');
		expect(accentFg?.pairedAgainst).toBe('accent');
	});

	it('pairs surface and semantic roles like every other role', () => {
		const { light } = hextimate('#3b82f6').audit();

		const surfaceStrong = light.find((t) => t.token === 'surface-strong');
		expect(surfaceStrong?.pairedAgainst).toBe('surface-foreground');

		for (const role of ['positive', 'negative', 'caution']) {
			const entry = light.find((t) => t.token === role);
			expect(entry?.pairedAgainst).toBe(`${role}-foreground`);
			const fg = light.find((t) => t.token === `${role}-foreground`);
			expect(fg?.pairedAgainst).toBe(role);
		}
	});

	it('reports ratios above the headline AAA target (min + margin)', () => {
		const { light } = hextimate('#3b82f6').audit();
		// Generation targets 7 + 0.15, so non-foreground fills clear 7 comfortably.
		const accentStrong = light.find((t) => t.token === 'accent-strong');
		expect(accentStrong?.ratio).toBeGreaterThan(7);
	});

	it('flags AA-only pairings when minContrastRatio is relaxed', () => {
		const { light } = hextimate('#3b82f6')
			.style({ minContrastRatio: 'AA' })
			.audit();
		const accent = light.find((t) => t.token === 'accent');

		expect(accent?.passesAA).toBe(true);
		expect(accent?.ratio).toBeGreaterThanOrEqual(4.5);
	});
});
