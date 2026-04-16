import { describe, expect, it } from 'bun:test';
import type { OKLCH } from '../types';
import { gamutMapOklch, gamutMapOklchToP3 } from './gamut';

describe('gamutMapOklch', () => {
  it('returns achromatic colors unchanged (c=0)', () => {
    const color: OKLCH = { space: 'oklch', l: 0.5, c: 0, h: 0, alpha: 1 };
    const result = gamutMapOklch(color);
    expect(result.c).toBe(0);
    expect(result.l).toBe(0.5);
  });

  it('preserves in-gamut colors', () => {
    // A mild, in-gamut color
    const color: OKLCH = { space: 'oklch', l: 0.7, c: 0.05, h: 90, alpha: 1 };
    const result = gamutMapOklch(color);
    expect(result.c).toBe(color.c);
    expect(result.l).toBe(color.l);
    expect(result.h).toBe(color.h);
  });

  it('reduces chroma for out-of-gamut colors', () => {
    // High chroma blue — guaranteed out of sRGB gamut
    const color: OKLCH = { space: 'oklch', l: 0.7, c: 0.3, h: 264, alpha: 1 };
    const result = gamutMapOklch(color);
    expect(result.c).toBeLessThan(color.c);
    expect(result.c).toBeGreaterThan(0);
  });

  it('preserves lightness and hue when mapping', () => {
    const color: OKLCH = { space: 'oklch', l: 0.7, c: 0.3, h: 264, alpha: 1 };
    const result = gamutMapOklch(color);
    expect(result.l).toBe(color.l);
    expect(result.h).toBe(color.h);
  });

  it('produces consistent perceived lightness across hues', () => {
    const l = 0.7;
    const c = 0.2;
    const hues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

    const mappedColors = hues.map((h) =>
      gamutMapOklch({ space: 'oklch', l, c, h, alpha: 1 }),
    );

    // All mapped colors should have the same L value
    for (const color of mappedColors) {
      expect(color.l).toBe(l);
    }
  });
});

describe('gamutMapOklchToP3', () => {
  it('returns achromatic colors unchanged', () => {
    const color: OKLCH = { space: 'oklch', l: 0.5, c: 0, h: 0, alpha: 1 };
    const result = gamutMapOklchToP3(color);
    expect(result.c).toBe(0);
  });

  it('preserves in-gamut colors', () => {
    const color: OKLCH = { space: 'oklch', l: 0.7, c: 0.05, h: 90, alpha: 1 };
    const result = gamutMapOklchToP3(color);
    expect(result.c).toBe(color.c);
  });

  it('allows higher chroma than sRGB gamut mapping', () => {
    // A vivid color that's out of sRGB but could be in P3
    const color: OKLCH = { space: 'oklch', l: 0.7, c: 0.2, h: 150, alpha: 1 };
    const srgbMapped = gamutMapOklch(color);
    const p3Mapped = gamutMapOklchToP3(color);

    // P3 gamut is wider, so it should preserve more chroma
    expect(p3Mapped.c).toBeGreaterThanOrEqual(srgbMapped.c);
  });

  it('reduces chroma for colors outside P3 gamut', () => {
    // Extremely high chroma — outside both sRGB and P3
    const color: OKLCH = { space: 'oklch', l: 0.7, c: 0.4, h: 264, alpha: 1 };
    const result = gamutMapOklchToP3(color);
    expect(result.c).toBeLessThan(color.c);
    expect(result.c).toBeGreaterThan(0);
  });

  it('preserves lightness and hue', () => {
    const color: OKLCH = { space: 'oklch', l: 0.7, c: 0.4, h: 264, alpha: 1 };
    const result = gamutMapOklchToP3(color);
    expect(result.l).toBe(color.l);
    expect(result.h).toBe(color.h);
  });
});
