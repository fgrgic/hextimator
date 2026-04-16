import { describe, expect, it } from 'bun:test';
import { tryParseCSSFunction } from './parseCSSFunction';

describe('tryParseCSSFunction', () => {
  describe('rgb / rgba', () => {
    it('parses rgb() with comma syntax', () => {
      expect(tryParseCSSFunction('rgb(255, 102, 102)')).toEqual({
        space: 'srgb',
        r: 255,
        g: 102,
        b: 102,
        alpha: 1,
      });
    });

    it('parses rgba(), ignoring alpha', () => {
      expect(tryParseCSSFunction('rgba(255, 102, 102, 0.5)')).toEqual({
        space: 'srgb',
        r: 255,
        g: 102,
        b: 102,
        alpha: 1,
      });
    });

    it('parses rgb() with space syntax and slash alpha, ignoring alpha', () => {
      expect(tryParseCSSFunction('rgb(255 102 102 / 0.5)')).toEqual({
        space: 'srgb',
        r: 255,
        g: 102,
        b: 102,
        alpha: 1,
      });
    });
  });

  describe('hsl / hsla', () => {
    it('parses hsl() with percentage values', () => {
      expect(tryParseCSSFunction('hsl(200, 10%, 50%)')).toEqual({
        space: 'hsl',
        h: 200,
        s: 0.1,
        l: 0.5,
        alpha: 1,
      });
    });

    it('parses hsla(), ignoring alpha', () => {
      const result = tryParseCSSFunction('hsla(200, 10%, 50%, 0.8)');
      expect(result).toEqual({
        space: 'hsl',
        h: 200,
        s: 0.1,
        l: 0.5,
        alpha: 1,
      });
    });
  });

  describe('oklch', () => {
    it('parses oklch()', () => {
      expect(tryParseCSSFunction('oklch(0.7 0.15 200)')).toEqual({
        space: 'oklch',
        l: 0.7,
        c: 0.15,
        h: 200,
        alpha: 1,
      });
    });

    it('parses oklch() with slash alpha, ignoring alpha', () => {
      expect(tryParseCSSFunction('oklch(0.7 0.15 200 / 0.5)')).toEqual({
        space: 'oklch',
        l: 0.7,
        c: 0.15,
        h: 200,
        alpha: 1,
      });
    });

    it("handles 'none' keyword", () => {
      const result = tryParseCSSFunction('oklch(0.7 none 200)');
      expect(result).toEqual({
        space: 'oklch',
        l: 0.7,
        c: 0,
        h: 200,
        alpha: 1,
      });
    });
  });

  describe('oklab', () => {
    it('parses oklab()', () => {
      expect(tryParseCSSFunction('oklab(0.7 0.05 -0.1)')).toEqual({
        space: 'oklab',
        l: 0.7,
        a: 0.05,
        b: -0.1,
        alpha: 1,
      });
    });
  });

  describe('color()', () => {
    it('parses color(srgb-linear ...)', () => {
      expect(tryParseCSSFunction('color(srgb-linear 0.9 0.4 0.4)')).toEqual({
        space: 'linear-rgb',
        r: 0.9,
        g: 0.4,
        b: 0.4,
        alpha: 1,
      });
    });

    it('parses color(display-p3 ...)', () => {
      expect(tryParseCSSFunction('color(display-p3 0.9 0.4 0.4)')).toEqual({
        space: 'display-p3',
        r: 0.9,
        g: 0.4,
        b: 0.4,
        alpha: 1,
      });
    });

    it('parses color(display-p3 ...) with alpha, ignoring alpha', () => {
      expect(
        tryParseCSSFunction('color(display-p3 0.9 0.4 0.4 / 0.5)'),
      ).toEqual({
        space: 'display-p3',
        r: 0.9,
        g: 0.4,
        b: 0.4,
        alpha: 1,
      });
    });

    it('returns null for unknown color space', () => {
      expect(tryParseCSSFunction('color(xyz 0.9 0.4 0.4)')).toBeNull();
    });
  });

  describe('invalid inputs', () => {
    it('returns null for non-function strings', () => {
      expect(tryParseCSSFunction('#ff6666')).toBeNull();
    });

    it('returns null for unknown function name', () => {
      expect(tryParseCSSFunction('cmyk(0, 0, 0, 0)')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(tryParseCSSFunction('')).toBeNull();
    });
  });
});
