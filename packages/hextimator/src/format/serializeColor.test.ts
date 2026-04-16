import { describe, expect, it } from 'bun:test';
import type { DisplayP3, HSL, OKLCH, RGB } from '../types';
import { serializeColor } from './serializeColor';

const red: RGB = { space: 'srgb', r: 255, g: 0, b: 0, alpha: 1 };
const p3Color: DisplayP3 = {
  space: 'display-p3',
  r: 0.9,
  g: 0.3,
  b: 0.3,
  alpha: 1,
};
const midGray: RGB = { space: 'srgb', r: 128, g: 128, b: 128, alpha: 1 };
const teal: HSL = { space: 'hsl', h: 180, s: 50, l: 40, alpha: 1 };
const oklchColor: OKLCH = {
  space: 'oklch',
  l: 0.6279,
  c: 0.258,
  h: 29.2,
  alpha: 1,
};

describe('serializeColor', () => {
  describe('hex (default)', () => {
    it('serializes red to #ff0000', () => {
      expect(serializeColor(red)).toBe('#ff0000');
    });

    it('defaults to hex when no format is provided', () => {
      expect(serializeColor(red, 'hex')).toBe(serializeColor(red));
    });

    it('serializes gray correctly', () => {
      expect(serializeColor(midGray)).toBe('#808080');
    });

    it('clamps out-of-range channel values', () => {
      const over: RGB = { space: 'srgb', r: 300, g: -10, b: 128, alpha: 1 };
      expect(serializeColor(over)).toBe('#ff0080');
    });
  });

  describe('rgb', () => {
    it('produces rgb() function syntax', () => {
      expect(serializeColor(red, 'rgb')).toBe('rgb(255, 0, 0)');
    });

    it('rounds fractional channel values', () => {
      const c: RGB = { space: 'srgb', r: 127.6, g: 0.4, b: 255, alpha: 1 };
      expect(serializeColor(c, 'rgb')).toBe('rgb(128, 0, 255)');
    });
  });

  describe('rgb-raw', () => {
    it('produces space-separated channel values', () => {
      expect(serializeColor(red, 'rgb-raw')).toBe('255 0 0');
    });
  });

  describe('hsl', () => {
    it('produces hsl() function syntax', () => {
      expect(serializeColor(teal, 'hsl')).toBe('hsl(180, 50%, 40%)');
    });

    it('converts from srgb to hsl', () => {
      const result = serializeColor(red, 'hsl');
      expect(result).toMatch(/^hsl\(/);
      expect(result).toContain('100%'); // saturation of pure red
    });
  });

  describe('hsl-raw', () => {
    it('produces space-separated H S% L%', () => {
      expect(serializeColor(teal, 'hsl-raw')).toBe('180 50% 40%');
    });
  });

  describe('oklch', () => {
    it('produces oklch() function syntax', () => {
      const result = serializeColor(oklchColor, 'oklch');
      expect(result).toMatch(/^oklch\(/);
      expect(result).toContain('0.6279');
    });

    it('converts from srgb to oklch', () => {
      const result = serializeColor(red, 'oklch');
      expect(result).toMatch(/^oklch\(0\.\d+ 0\.\d+ \d/);
    });
  });

  describe('oklch-raw', () => {
    it('produces space-separated L C H values', () => {
      const result = serializeColor(oklchColor, 'oklch-raw');
      expect(result).not.toContain('oklch(');
      expect(result).toMatch(/^0\.\d+ 0\.\d+ \d/);
    });
  });

  describe('p3', () => {
    it('produces color(display-p3 ...) function syntax', () => {
      const result = serializeColor(p3Color, 'p3');
      expect(result).toMatch(/^color\(display-p3 /);
      expect(result).toContain('0.9');
    });

    it('converts from srgb to p3', () => {
      const result = serializeColor(red, 'p3');
      expect(result).toMatch(/^color\(display-p3 /);
    });

    it('clamps values to 0-1 range', () => {
      const result = serializeColor(red, 'p3');
      const match = result.match(
        /color\(display-p3 ([\d.]+) ([\d.]+) ([\d.]+)\)/,
      );
      expect(match).not.toBeNull();
      if (match) {
        for (const v of [match[1], match[2], match[3]]) {
          const n = parseFloat(v);
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  describe('p3-raw', () => {
    it('produces space-separated R G B values', () => {
      const result = serializeColor(p3Color, 'p3-raw');
      expect(result).not.toContain('color(');
      expect(result).toMatch(/^0\.\d+ 0\.\d+ 0\.\d+$/);
    });
  });
});
