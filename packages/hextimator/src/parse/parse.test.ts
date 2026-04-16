import { describe, expect, it } from 'bun:test';
import { parse } from './parse';

describe('parse', () => {
  it('returns a Color object as-is', () => {
    const color = { space: 'srgb' as const, r: 255, g: 0, b: 0, alpha: 1 };
    expect(parse(color)).toBe(color);
  });

  it('parses a numeric hex value', () => {
    expect(parse(0xff0000)).toEqual({
      space: 'srgb',
      r: 255,
      g: 0,
      b: 0,
      alpha: 1,
    });
  });

  it('parses a hex string', () => {
    expect(parse('#ff0000')).toEqual({
      space: 'srgb',
      r: 255,
      g: 0,
      b: 0,
      alpha: 1,
    });
  });

  it('parses a CSS function string', () => {
    expect(parse('rgb(255, 0, 0)')).toEqual({
      space: 'srgb',
      r: 255,
      g: 0,
      b: 0,
      alpha: 1,
    });
  });

  it('parses a comma-separated string', () => {
    expect(parse('255, 0, 0')).toEqual({
      space: 'srgb',
      r: 255,
      g: 0,
      b: 0,
      alpha: 1,
    });
  });

  it('parses a tuple', () => {
    expect(parse([255, 0, 0])).toEqual({
      space: 'srgb',
      r: 255,
      g: 0,
      b: 0,
      alpha: 1,
    });
  });

  it('normalizes string input (trims whitespace and lowercases)', () => {
    expect(parse('  #FF0000  ')).toEqual({
      space: 'srgb',
      r: 255,
      g: 0,
      b: 0,
      alpha: 1,
    });
  });

  it('throws ColorParseError for unrecognized string', () => {
    expect(() => parse('not-a-color')).toThrow('Unrecognized color format');
  });

  it('throws ColorParseError for an out-of-range number', () => {
    expect(() => parse(-1)).toThrow();
  });
});
