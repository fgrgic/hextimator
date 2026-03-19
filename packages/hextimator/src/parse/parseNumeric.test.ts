import { describe, expect, it } from 'bun:test';
import { tryParseNumeric } from './parseNumeric';

describe('tryParseNumeric', () => {
	it('parses 6-digit RGB', () => {
		expect(tryParseNumeric(0xff6666)).toEqual({
			space: 'srgb',
			r: 255,
			g: 102,
			b: 102,
			alpha: 1,
		});
	});

	it('parses black (0)', () => {
		expect(tryParseNumeric(0x000000)).toEqual({
			space: 'srgb',
			r: 0,
			g: 0,
			b: 0,
			alpha: 1,
		});
	});

	it('parses white (0xffffff)', () => {
		expect(tryParseNumeric(0xffffff)).toEqual({
			space: 'srgb',
			r: 255,
			g: 255,
			b: 255,
			alpha: 1,
		});
	});

	it('parses 8-digit RGBA', () => {
		const result = tryParseNumeric(0xff666680);
		expect(result?.r).toBe(255);
		expect(result?.g).toBe(102);
		expect(result?.b).toBe(102);
		expect(result?.alpha).toBeCloseTo(0x80 / 255, 5);
	});

	it('returns null for negative numbers', () => {
		expect(tryParseNumeric(-1)).toBeNull();
	});

	it('returns null for numbers exceeding 0xffffffff', () => {
		expect(tryParseNumeric(0x1_0000_0000)).toBeNull();
	});

	it('returns null for non-integers', () => {
		expect(tryParseNumeric(255.5)).toBeNull();
	});
});
