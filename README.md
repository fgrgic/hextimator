# hextimator

Generate perceptually uniform color palettes from any input color. Throw in a hex code (or RGB, HSL, OKLCH...) and get a full theme — accent scales, base tones, and semantic colors (positive/negative/warning) — all with consistent perceived contrast across hues.

Built for runtime use: output CSS custom properties, Tailwind tokens, SCSS variables, or plain objects. Ideal for products where each account/tenant needs its own branded theme generated on the fly.

## Installation

```bash
npm install hextimator
```

## Quick start

```typescript
import { hextimate } from "hextimator";

const theme = hextimate("#6A5ACD").format();

// theme.light / theme.dark each contain your full theme tokens
console.log(theme.light);
// { accent: "#...", "accent-strong": "#...", base: "#...", ... }
```

## Two-step API: generate, then format

hextimator separates **palette generation** (color math) from **formatting** (output shape). This lets you extend the palette before choosing how to serialize it.

```typescript
const theme = hextimate("#6A5ACD")
  .format({ as: "css", colors: "oklch" });
// { light: { "--accent": "oklch(...)", "--base": "...", ... }, dark: { ... } }
```

### Output formats

```typescript
// CSS custom properties
hextimate("#6A5ACD").format({ as: "css" });
// → { light: { "--accent": "#...", "--accent-strong": "#...", ... }, dark: { ... } }

// Tailwind nested tokens
hextimate("#6A5ACD").format({ as: "tailwind" });
// → { light: { accent: { DEFAULT: "#...", strong: "#...", ... }, ... }, dark: { ... } }

// SCSS variables
hextimate("#6A5ACD").format({ as: "scss" });

// JSON string
hextimate("#6A5ACD").format({ as: "json" });

// Plain object (default)
hextimate("#6A5ACD").format();
```

### Color value formats

```typescript
hextimate("#6A5ACD").format({ colors: "hex" });       // "#6a5acd" (default)
hextimate("#6A5ACD").format({ colors: "oklch" });      // "oklch(0.54 0.18 276)"
hextimate("#6A5ACD").format({ colors: "oklch-raw" });  // "0.54 0.18 276"
hextimate("#6A5ACD").format({ colors: "rgb" });        // "rgb(106, 90, 205)"
hextimate("#6A5ACD").format({ colors: "rgb-raw" });    // "106 90 205"
hextimate("#6A5ACD").format({ colors: "hsl" });        // "hsl(248, 53%, 58%)"
hextimate("#6A5ACD").format({ colors: "hsl-raw" });    // "248 53% 58%"
```

### Flexible input

```typescript
hextimate("#FF6666");            // hex string
hextimate("rgb(255, 102, 102)"); // CSS function
hextimate([255, 102, 102]);      // RGB tuple
hextimate(0xff6666);             // numeric hex
```

## Extending the palette

### `addRole` — add a new color with its full scale

Need more than the built-in 5 roles? Add any number of seed colors. Each gets its own DEFAULT, strong, weak, and foreground variants.

```typescript
hextimate("#6A5ACD")
  .addRole("cta", "#EE2244")
  .addRole("info", "#2266EE")
  .format({ as: "css" });
// Adds: --cta, --cta-strong, --cta-weak, --cta-foreground,
//       --info, --info-strong, --info-weak, --info-foreground
```

### `addVariant` — add a lightness step to every role

Extend the scale depth across all roles at once.

```typescript
hextimate("#6A5ACD")
  .addVariant("hover", { beyond: "strong" })
  .addVariant("subtle", { between: ["DEFAULT", "weak"] })
  .format({ as: "tailwind" });
// Every role now has: DEFAULT, strong, weak, foreground, hover, subtle
```

- `{ beyond: "strong" }` — one step past strong (stronger)
- `{ beyond: "weak" }` — one step past weak (weaker)
- `{ beyond: "hover" }` — chain them: go past a custom variant
- `{ between: ["DEFAULT", "weak"] }` — midpoint between two variants

### `addToken` — add standalone derived tokens

For one-off tokens that don't need a full scale. Every token is derived from the palette, so changing the seed color updates everything.

```typescript
hextimate("#6A5ACD")
  .addToken("border", { from: "base.weak", lightness: -0.05 })
  .addToken("ring", { from: "accent" })
  .addToken("placeholder", { from: "base.foreground", lightness: +0.3 })
  .format({ as: "css" });
// Adds: --border, --ring, --placeholder
```

When light and dark themes need different directions:

```typescript
.addToken("border", {
  light: { from: "base.weak", lightness: -0.05 },
  dark: { from: "base.weak", lightness: +0.05 },
})
```

## Real-world examples

### shadcn/ui theme

```typescript
const theme = hextimate("#6366F1")
  .addRole("muted", "#94A3B8")
  .addRole("card", "#F8FAFC")
  .addRole("popover", "#F8FAFC")
  .addToken("border", {
    light: { from: "base.weak", lightness: -0.08 },
    dark: { from: "base.weak", lightness: +0.08 },
  })
  .addToken("input", {
    light: { from: "base.weak", lightness: -0.1 },
    dark: { from: "base.weak", lightness: +0.1 },
  })
  .addToken("ring", { from: "accent" })
  .format({
    as: "css",
    colors: "oklch",
    roleNames: {
      base: "background",
      accent: "primary",
      positive: "success",
      negative: "destructive",
      warning: "warning",
      muted: "muted",
      card: "card",
      popover: "popover",
    },
    variantNames: {
      foreground: "foreground",
    },
  });
```

### Stripe-style payment UI

```typescript
const theme = hextimate("#635BFF")
  .addToken("text-secondary", { from: "base.foreground", lightness: +0.25 })
  .addToken("text-placeholder", { from: "base.foreground", lightness: +0.4 })
  .addToken("icon", { from: "base.foreground", lightness: +0.15 })
  .format({
    roleNames: {
      accent: "primary",
      base: "background",
      positive: "success",
      negative: "danger",
      warning: "warning",
    },
    variantNames: {
      foreground: "text",
    },
  });
```

### Slack-style sidebar

```typescript
const theme = hextimate("#4A154B")
  .format({
    roleNames: {
      base: "column-bg",
      accent: "active-item",
      positive: "active-presence",
      negative: "mention-badge",
    },
    variantNames: {
      DEFAULT: "DEFAULT",
      strong: "menu-bg",
      weak: "hover-item",
      foreground: "text-color",
    },
  });
```

## Customization

### Generation options

Passed to `hextimate()` — these affect how colors are generated.

```typescript
hextimate("#6A5ACD", {
  preferredBaseColors: { dark: "#111111", light: "#FEFEFE" },
  semanticColors: { positive: "#22C55E" },
  semanticColorRanges: { positive: [90, 150] },
  neutralColorsMaxChroma: 0.02,
  themeLightness: 0.65,
});
```

### Format options

Passed to `.format()` — these affect the output shape.

```typescript
.format({
  as: "css",           // "object" | "css" | "tailwind" | "scss" | "json"
  colors: "oklch",     // "hex" | "rgb" | "rgb-raw" | "hsl" | "hsl-raw" | "oklch" | "oklch-raw"
  roleNames: { accent: "brand", base: "surface" },
  variantNames: { strong: "primary", weak: "tertiary", foreground: "text" },
  separator: "-",      // token key separator
})
```

## How it works

1. **Parse** any color input into a normalized `Color` object.
2. **Convert** to OKLCH (perceptual color space) so lightness and chroma adjustments look uniform across hues.
3. **Generate** accent, base, and semantic color scales — each with DEFAULT, strong, weak, and foreground variants.
4. **Gamut-map** back to sRGB via binary-search chroma reduction (preserves lightness and hue).
5. **Format** into your chosen output (CSS vars, Tailwind, SCSS, JSON, or plain object).

## Utilities

hextimator also exports its parsing and conversion functions for standalone use:

```typescript
import { parseColor, convertColor } from "hextimator";

const color = parseColor("rgb(255, 102, 102)");
const oklch = convertColor(color, "oklch");
```

## Dev workflow

In one terminal, watch-build the package:

```bash
cd packages/hextimator && bun run dev
```

In another, start the playground:

```bash
cd apps/playground && bun run dev
```

> The playground imports from `dist/`, so keep the package's `bun run dev` running to auto-rebuild on changes.

## Contributing

Issues and PRs are welcome at [github.com/fgrgic/hextimator](https://github.com/fgrgic/hextimator/issues).

## License

ISC © [fgrgic](https://github.com/fgrgic)
