# hextimator

One brand color in, full accessible theme out.

- Input: any single color. Output: complete light + dark theme with accessibility guarantees (AAA contrast by default).
- Works at runtime — built for multi-tenant apps that need per-brand themes on the fly.
- Perceptually uniform (OKLCH) — blue and yellow palettes look equally balanced, unlike HSL-based generators.

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

| Format | `as` | Token shape |
|---|---|---|
| Plain object (default) | `"object"` | `{ "accent": "#...", "accent-strong": "#...", ... }` |
| CSS custom properties | `"css"` | `{ "--accent": "#...", "--accent-strong": "#...", ... }` |
| Tailwind nested tokens | `"tailwind"` | `{ accent: { DEFAULT: "#...", strong: "#...", ... }, ... }` |
| SCSS variables | `"scss"` | `{ "$accent": "#...", "$accent-strong": "#...", ... }` |
| JSON string | `"json"` | `'{ "accent": "#...", "accent-strong": "#...", ... }'` |

All formats return `{ light: { ... }, dark: { ... } }`.

### Color value formats

| `colors` | Example output |
|---|---|
| `"hex"` (default) | `"#6a5acd"` |
| `"oklch"` | `"oklch(0.54 0.18 276)"` |
| `"oklch-raw"` | `"0.54 0.18 276"` |
| `"rgb"` | `"rgb(106, 90, 205)"` |
| `"rgb-raw"` | `"106 90 205"` |
| `"hsl"` | `"hsl(248, 53%, 58%)"` |
| `"hsl-raw"` | `"248 53% 58%"` |

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
  .format({ as: "css" });
// Adds: --cta, --cta-strong, --cta-weak, --cta-foreground,
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

You can also pass a raw color value instead of deriving from the palette:

```typescript
.addToken("brand-exact", "#FF6600")
.addToken("surface", {
  light: "#ffffff",
  dark: "#1a1a1a",
})
```

When light and dark themes need different directions:

```typescript
.addToken("border", {
  light: { from: "base.weak", lightness: -0.05 },
  dark: { from: "base.weak", lightness: +0.05 },
})
```

## Customization

### Generation options

Passed to `hextimate()` — these affect how colors are generated.

| Option | Type | Default | Description |
|---|---|---|---|
| `preferredBaseColors` | `{ dark?: color, light?: color }` | `{ dark: "#1a1a1a", light: "#ffffff" }` | Base colors used as baseline for generating the rest of the base scale |
| `semanticColors` | `{ positive?: color, negative?: color, warning?: color }` | Auto-generated from seed | Override specific semantic colors instead of deriving them |
| `semanticColorRanges` | `{ positive?: [start, end], ... }` | `positive: [90,150]`, `negative: [345,15]`, `warning: [35,55]` | Hue degree ranges for finding semantic colors |
| `neutralColorsMaxChroma` | `number` | `0.02` | Max chroma for base and foreground colors (higher = more saturated neutrals) |
| `themeLightness` | `number` (0–1) | `0.8` | Perceived lightness of the generated theme |
| `minContrastRatio` | `"AAA" \| "AA" \| number` | `"AAA"` | Minimum WCAG contrast ratio between variants and foreground. `"AAA"` = 7, `"AA"` = 4.5, or pass any number |

### Format options

Passed to `.format()` — these affect the output shape.

| Option | Type | Default | Description |
|---|---|---|---|
| `as` | `"object" \| "css" \| "tailwind" \| "scss" \| "json"` | `"object"` | Output format (see [Output formats](#output-formats)) |
| `colors` | `"hex" \| "rgb" \| "rgb-raw" \| "hsl" \| "hsl-raw" \| "oklch" \| "oklch-raw"` | `"hex"` | Color value serialization (see [Color value formats](#color-value-formats)) |
| `roleNames` | `Record<string, string>` | Built-in names | Rename roles in output keys (e.g. `{ accent: "brand", base: "surface" }`) |
| `variantNames` | `Record<string, string>` | Built-in names | Rename variant suffixes in output keys (e.g. `{ strong: "primary", foreground: "text" }`) |
| `separator` | `string` | `"-"` | Separator between role and variant in token keys |

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

// Output keys (light & dark):
// --background, --background-foreground, --primary, --primary-foreground,
// --success, --destructive, --warning, --muted, --card, --popover,
// --border, --input, --ring, + strong/weak variants for each role
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

// Output keys (light & dark):
// primary, primary-strong, primary-weak, primary-text,
// background, background-strong, background-weak, background-text,
// success, danger, warning + variants,
// text-secondary, text-placeholder, icon
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

// Output keys (light & dark):
// column-bg-DEFAULT, column-bg-menu-bg, column-bg-hover-item, column-bg-text-color,
// active-item-DEFAULT, active-item-menu-bg, active-item-hover-item, active-item-text-color,
// active-presence, mention-badge, warning + variants
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
