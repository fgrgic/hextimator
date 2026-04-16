import { describe, expect, it } from 'bun:test';
import { convert } from '../../convert';
import { parse } from '../../parse';
import { simulateCVD } from './matrices';
import { simulateColor } from './simulate';

describe('simulateCVD', () => {
  it('returns the original color at severity 0', () => {
    const rgb: [number, number, number] = [0.5, 0.3, 0.1];
    const result = simulateCVD(rgb, 'deuteranopia', 0);
    expect(result).toEqual([0.5, 0.3, 0.1]);
  });

  it('produces a grayscale color for achromatopsia', () => {
    const rgb: [number, number, number] = [0.8, 0.2, 0.4];
    const [r, g, b] = simulateCVD(rgb, 'achromatopsia', 1);
    // All channels should be equal (luminance)
    expect(r).toBeCloseTo(g, 10);
    expect(g).toBeCloseTo(b, 10);
  });

  it('partial severity interpolates toward simulated', () => {
    const rgb: [number, number, number] = [0.8, 0.2, 0.1];
    const full = simulateCVD(rgb, 'protanopia', 1);
    const half = simulateCVD(rgb, 'protanopia', 0.5);

    // Half severity should be between original and full simulation
    for (let i = 0; i < 3; i++) {
      const expected = rgb[i] + 0.5 * (full[i] - rgb[i]);
      expect(half[i]).toBeCloseTo(expected, 10);
    }
  });

  it('deuteranopia collapses red-green distinction', () => {
    const red: [number, number, number] = [0.8, 0.1, 0.1];
    const green: [number, number, number] = [0.1, 0.8, 0.1];
    const simRed = simulateCVD(red, 'deuteranopia', 1);
    const simGreen = simulateCVD(green, 'deuteranopia', 1);

    // Simulated red and green should be much closer than originals
    const origDist = Math.hypot(
      red[0] - green[0],
      red[1] - green[1],
      red[2] - green[2],
    );
    const simDist = Math.hypot(
      simRed[0] - simGreen[0],
      simRed[1] - simGreen[1],
      simRed[2] - simGreen[2],
    );
    expect(simDist).toBeLessThan(origDist);
  });
});

describe('simulateColor', () => {
  it('returns OKLCH', () => {
    const result = simulateColor(parse('#ff6600'), 'deuteranopia');
    expect(result.space).toBe('oklch');
  });

  it('preserves alpha', () => {
    const color = { space: 'srgb' as const, r: 255, g: 100, b: 0, alpha: 0.5 };
    const result = simulateColor(color, 'protanopia');
    expect(result.alpha).toBe(0.5);
  });

  it('achromatopsia produces near-zero chroma', () => {
    const result = simulateColor(parse('#ff6600'), 'achromatopsia');
    expect(result.c).toBeLessThan(0.01);
  });

  it('severity 0 returns original color', () => {
    const original = convert(parse('#ff6600'), 'oklch');
    const result = simulateColor(parse('#ff6600'), 'deuteranopia', 0);
    expect(result.l).toBeCloseTo(original.l, 4);
    expect(result.c).toBeCloseTo(original.c, 4);
    expect(result.h).toBeCloseTo(original.h, 2);
  });
});
