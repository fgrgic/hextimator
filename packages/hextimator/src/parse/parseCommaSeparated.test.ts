import { describe, expect, it } from 'bun:test';
import { tryParseCommaSeparated } from './parseCommaSeparated';

describe('tryParseCommaSeparated', () => {
	it('parses 3-value sRGB (default space)', () => {
		expect(tryParseCommaSeparated('255, 102, 102')).toEqual({
			space: 'srgb',
			r: 255,
			g: 102,
			b: 102,
			alpha: 1,
		});
	});

	it('parses 4-value sRGB, ignoring alpha', () => {
		expect(tryParseCommaSeparated('255, 102, 102, 0.5')).toEqual({
			space: 'srgb',
			r: 255,
			g: 102,
			b: 102,
			alpha: 1,
		});
	});

	it('respects assumeSpace for hsl', () => {
		expect(tryParseCommaSeparated('200, 50, 50', 'hsl')).toEqual({
			space: 'hsl',
			h: 200,
			s: 50,
			l: 50,
			alpha: 1,
		});
	});

	it('returns null for fewer than 3 values', () => {
		expect(tryParseCommaSeparated('255, 102')).toBeNull();
	});

	it('returns null for more than 4 values', () => {
		expect(tryParseCommaSeparated('255, 102, 102, 1, 0')).toBeNull();
	});

	it('returns null for non-numeric values', () => {
		expect(tryParseCommaSeparated('red, green, blue')).toBeNull();
	});
});
