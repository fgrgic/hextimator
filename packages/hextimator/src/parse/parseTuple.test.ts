import { describe, expect, it } from 'bun:test';
import { tryParseTuple } from './parseTuple';

describe('tryParseTuple', () => {
	it('defaults to srgb space', () => {
		expect(tryParseTuple([255, 102, 102])).toEqual({
			space: 'srgb',
			r: 255,
			g: 102,
			b: 102,
			alpha: 1,
		});
	});

	it('ignores alpha from 4-tuple', () => {
		expect(tryParseTuple([255, 102, 102, 0.5])).toEqual({
			space: 'srgb',
			r: 255,
			g: 102,
			b: 102,
			alpha: 1,
		});
	});

	it('parses hsl space', () => {
		expect(tryParseTuple([200, 50, 50], 'hsl')).toEqual({
			space: 'hsl',
			h: 200,
			s: 50,
			l: 50,
			alpha: 1,
		});
	});

	it('parses oklch space', () => {
		expect(tryParseTuple([0.7, 0.15, 200], 'oklch')).toEqual({
			space: 'oklch',
			l: 0.7,
			c: 0.15,
			h: 200,
			alpha: 1,
		});
	});

	it('parses oklab space', () => {
		expect(tryParseTuple([0.7, 0.05, -0.1], 'oklab')).toEqual({
			space: 'oklab',
			l: 0.7,
			a: 0.05,
			b: -0.1,
			alpha: 1,
		});
	});

	it('parses linear-rgb space', () => {
		expect(tryParseTuple([1, 0.4, 0.4], 'linear-rgb')).toEqual({
			space: 'linear-rgb',
			r: 1,
			g: 0.4,
			b: 0.4,
			alpha: 1,
		});
	});

	it('returns null for unknown space', () => {
		// @ts-expect-error testing invalid space
		expect(tryParseTuple([1, 2, 3], 'xyz')).toBeNull();
	});
});
