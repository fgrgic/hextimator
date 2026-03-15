import { describe, it, expect } from "bun:test";
import { tryParseHex } from "./parseHex";

describe("tryParseHex", () => {
  it("parses prefixed 6-digit hex", () => {
    expect(tryParseHex("#ff6666")).toEqual({
      space: "srgb",
      r: 255,
      g: 102,
      b: 102,
      alpha: 1,
    });
  });

  it("parses prefixed 3-digit shorthand", () => {
    expect(tryParseHex("#f66")).toEqual({
      space: "srgb",
      r: 255,
      g: 102,
      b: 102,
      alpha: 1,
    });
  });

  it("parses prefixed 8-digit hex with alpha", () => {
    const result = tryParseHex("#ff666680");
    expect(result?.r).toBe(255);
    expect(result?.g).toBe(102);
    expect(result?.b).toBe(102);
    expect(result?.alpha).toBeCloseTo(0x80 / 255, 5);
  });

  it("parses prefixed 4-digit shorthand with alpha", () => {
    const result = tryParseHex("#f668");
    expect(result?.r).toBe(255);
    expect(result?.g).toBe(102);
    expect(result?.b).toBe(102);
    expect(result?.alpha).toBeCloseTo(0x88 / 255, 5);
  });

  it("parses bare 6-digit hex without prefix", () => {
    expect(tryParseHex("ff6666")).toEqual({
      space: "srgb",
      r: 255,
      g: 102,
      b: 102,
      alpha: 1,
    });
  });

  it("parses 0x-prefixed hex", () => {
    expect(tryParseHex("0xff6666")).toEqual({
      space: "srgb",
      r: 255,
      g: 102,
      b: 102,
      alpha: 1,
    });
  });

  it("returns null for invalid input", () => {
    expect(tryParseHex("not-a-color")).toBeNull();
  });

  it("returns null for 5-digit hex", () => {
    expect(tryParseHex("#fffff")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(tryParseHex("")).toBeNull();
  });
});
