import { describe, it, expect } from "bun:test";
import { convert } from "./index";
import type { RGB, HSL, OKLCH, OKLab, LinearRGB, ColorSpace } from "../types";

const red: RGB = { space: "srgb", r: 255, g: 0, b: 0, alpha: 1 };
const white: RGB = { space: "srgb", r: 255, g: 255, b: 255, alpha: 1 };
const black: RGB = { space: "srgb", r: 0, g: 0, b: 0, alpha: 1 };

describe("convert() dispatcher", () => {
  it("returns a copy for identity conversions", () => {
    const result = convert(red, "srgb");
    expect(result).toEqual(red);
    expect(result).not.toBe(red); // different object
  });

  it("srgb → oklch → srgb round-trip within ±1", () => {
    const oklch = convert(red, "oklch");
    expect(oklch.space).toBe("oklch");
    const back = convert(oklch, "srgb");
    expect(Math.abs(back.r - 255)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.g - 0)).toBeLessThanOrEqual(1);
    expect(Math.abs(back.b - 0)).toBeLessThanOrEqual(1);
  });

  it("srgb → hsl → srgb round-trip", () => {
    const hsl = convert(red, "hsl");
    expect(hsl.space).toBe("hsl");
    expect(hsl.h).toBeCloseTo(0, 3);
    expect(hsl.s).toBeCloseTo(100, 3);
    const back = convert(hsl, "srgb");
    expect(back.r).toBe(255);
    expect(back.g).toBe(0);
    expect(back.b).toBe(0);
  });

  it("hsl → oklch → hsl round-trip", () => {
    const hsl: HSL = { space: "hsl", h: 200, s: 80, l: 50, alpha: 1 };
    const oklch = convert(hsl, "oklch");
    expect(oklch.space).toBe("oklch");
    const back = convert(oklch, "hsl");
    expect(Math.abs(back.h - hsl.h)).toBeLessThan(1);
    expect(Math.abs(back.s - hsl.s)).toBeLessThan(2);
    expect(Math.abs(back.l - hsl.l)).toBeLessThan(1);
  });

  it("preserves alpha through conversions", () => {
    const c: RGB = { ...red, alpha: 0.42 };
    const oklch = convert(c, "oklch");
    expect(oklch.alpha).toBe(0.42);
    const back = convert(oklch, "srgb");
    expect(back.alpha).toBe(0.42);
  });

  it("converts white to OKLCH with L≈1, C≈0", () => {
    const result = convert(white, "oklch");
    expect(result.l).toBeCloseTo(1, 3);
    expect(result.c).toBeCloseTo(0, 3);
  });

  it("converts black to OKLCH with L≈0, C≈0", () => {
    const result = convert(black, "oklch");
    expect(result.l).toBeCloseTo(0, 3);
    expect(result.c).toBeCloseTo(0, 3);
  });

  it("throws for unsupported conversion", () => {
    expect(() => convert(red, "p3" as any)).toThrow("Unsupported conversion");
  });
});

describe("convert() covers all 20 directed pairs", () => {
  const spaces: ColorSpace[] = ["srgb", "linear-rgb", "oklab", "oklch", "hsl"];

  const samples: Record<string, any> = {
    srgb: red,
    "linear-rgb": { space: "linear-rgb", r: 1, g: 0, b: 0, alpha: 1 } as LinearRGB,
    oklab: { space: "oklab", l: 0.6279, a: 0.2249, b: 0.1264, alpha: 1 } as OKLab,
    oklch: { space: "oklch", l: 0.6279, c: 0.2580, h: 29.23, alpha: 1 } as OKLCH,
    hsl: { space: "hsl", h: 0, s: 100, l: 50, alpha: 1 } as HSL,
  };

  for (const from of spaces) {
    for (const to of spaces) {
      if (from === to) continue;
      it(`${from} → ${to}`, () => {
        const result = convert(samples[from], to);
        expect(result.space).toBe(to);
      });
    }
  }
});
