import { describe, it, expect } from "bun:test";
import {
  formatObject,
  formatCSS,
  formatSCSS,
  formatTailwind,
  formatJSON,
} from "./formatters";
import type { TokenEntry } from "./types";

const entries: TokenEntry[] = [
  { role: "base", variant: "DEFAULT", isDefault: true, value: "#ffffff" },
  { role: "base", variant: "strong", isDefault: false, value: "#cccccc" },
  { role: "accent", variant: "DEFAULT", isDefault: true, value: "#0000ff" },
  { role: "accent", variant: "weak", isDefault: false, value: "#8888ff" },
];

describe("formatObject", () => {
  it("collapses DEFAULT variant to just the role name", () => {
    const result = formatObject(entries, "-");
    expect(result["base"]).toBe("#ffffff");
  });

  it("combines role and variant with separator for non-DEFAULT", () => {
    const result = formatObject(entries, "-");
    expect(result["base-strong"]).toBe("#cccccc");
  });

  it("respects custom separator", () => {
    const result = formatObject(entries, "_");
    expect(result["base_strong"]).toBe("#cccccc");
    expect(result["accent_weak"]).toBe("#8888ff");
  });

  it("includes all entries", () => {
    const result = formatObject(entries, "-");
    expect(Object.keys(result)).toHaveLength(4);
  });
});

describe("formatCSS", () => {
  it("prefixes keys with --", () => {
    const result = formatCSS(entries, "-");
    expect(result["--base"]).toBe("#ffffff");
    expect(result["--base-strong"]).toBe("#cccccc");
  });

  it("does not include unprefixed keys", () => {
    const result = formatCSS(entries, "-");
    expect(result["base"]).toBeUndefined();
  });
});

describe("formatSCSS", () => {
  it("prefixes keys with $", () => {
    const result = formatSCSS(entries, "-");
    expect(result["$base"]).toBe("#ffffff");
    expect(result["$base-strong"]).toBe("#cccccc");
  });

  it("does not include unprefixed keys", () => {
    const result = formatSCSS(entries, "-");
    expect(result["base"]).toBeUndefined();
  });
});

describe("formatTailwind", () => {
  it("produces a nested role → variant → value structure", () => {
    const result = formatTailwind(entries);
    expect(result["base"]["DEFAULT"]).toBe("#ffffff");
    expect(result["base"]["strong"]).toBe("#cccccc");
    expect(result["accent"]["DEFAULT"]).toBe("#0000ff");
    expect(result["accent"]["weak"]).toBe("#8888ff");
  });

  it("groups all variants under their role", () => {
    const result = formatTailwind(entries);
    expect(Object.keys(result["base"])).toEqual(["DEFAULT", "strong"]);
  });
});

describe("formatJSON", () => {
  it("returns a valid JSON string", () => {
    const result = formatJSON(entries, "-");
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("contains the expected keys and values", () => {
    const result = formatJSON(entries, "-");
    const parsed = JSON.parse(result);
    expect(parsed["base"]).toBe("#ffffff");
    expect(parsed["base-strong"]).toBe("#cccccc");
  });

  it("is pretty-printed (contains newlines)", () => {
    const result = formatJSON(entries, "-");
    expect(result).toContain("\n");
  });
});
