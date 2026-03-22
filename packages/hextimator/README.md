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
| Tailwind CSS `@theme` | `"tailwind-css"` | `@theme { --color-accent: #...; --color-accent-strong: #...; ... }` |
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
| `"p3"` | `"color(display-p3 0.39 0.34 0.79)"` |
| `"p3-raw"` | `"0.39 0.34 0.79"` |

### Flexible input

```typescript
hextimate("#FF6666");            // hex string
hextimate("rgb(255, 102, 102)"); // CSS function
hextimate([255, 102, 102]);      // RGB tuple
hextimate(0xff6666);             // numeric hex
```

> **Note on alpha**: Alpha values are intentionally ignored everywhere — `rgba(255, 0, 0, 0.5)` is treated as fully opaque `rgb(255, 0, 0)`. Alpha tokens undermine accessibility guarantees because contrast ratios depend on the background, which hextimator does not control.

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
| `baseColor` | `ColorInput` | Auto-generated from input color with very low chroma | Base color used as baseline for generating the rest of the base scale |
| `semanticColors` | `{ positive?: color, negative?: color, warning?: color }` | Auto-generated from seed | Override specific semantic colors instead of deriving them |
| `semanticColorRanges` | `{ positive?: [start, end], ... }` | `positive: [135,160]`, `negative: [5,25]`, `warning: [45,65]` | Hue degree ranges for finding semantic colors. Ranges are clockwise arcs; `[350, 10]` wraps through 0°. |
| `baseMaxChroma` | `number` | `0.01` | Max chroma for baseline colors (higher = more colorful) |
| `foregroundMaxChroma` | `number` | `0.01` | Max chroma for foreground colors (higher = more colorful) |
| `themeLightness` | `number` (0–1) | `0.8` | Perceived lightness of the generated theme |
| `minContrastRatio` | `"AAA" \| "AA" \| number` | `"AAA"` | Minimum WCAG contrast ratio between variants and foreground. `"AAA"` = 7, `"AA"` = 4.5, or pass any number |
| `invertDarkModeBaseAccent` | `boolean` | `false` | Swap base and accent hues in dark mode. The dark theme's base scale takes the accent hue and vice versa, creating a more visually distinct dark theme. Requires a `baseColor` to be set |

### Format options

Passed to `.format()` — these affect the output shape.

| Option | Type | Default | Description |
|---|---|---|---|
| `as` | `"object" \| "css" \| "tailwind" \| "tailwind-css" \| "scss" \| "json"` | `"object"` | Output format (see [Output formats](#output-formats)) |
| `colors` | `"hex" \| "rgb" \| "rgb-raw" \| "hsl" \| "hsl-raw" \| "oklch" \| "oklch-raw" \| "p3" \| "p3-raw"` | `"hex"` | Color value serialization (see [Color value formats](#color-value-formats)) |
| `roleNames` | `Record<string, string>` | Built-in names | Rename roles in output keys (e.g. `{ accent: "brand", base: "surface" }`) |
| `variantNames` | `Record<string, string>` | Built-in names | Rename variant suffixes in output keys (e.g. `{ strong: "primary", foreground: "text" }`) |
| `separator` | `string` | `"-"` | Separator between role and variant in token keys |

## Tailwind CSS v4

hextimator ships a ready-made CSS file that registers all built-in color tokens with Tailwind v4. This gives you utility classes like `bg-accent`, `text-base-foreground`, `border-negative`, etc.

### Setup

1. Install Tailwind v4 with the Vite plugin:

```bash
npm install tailwindcss @tailwindcss/vite
```

2. Add the plugin to your `vite.config.ts`:

```typescript
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

3. Import Tailwind and hextimator's theme in your CSS:

```css
@import "tailwindcss";
@import "hextimator/tailwind.css";
```

That's it. All 20 built-in tokens (accent, base, positive, negative, warning × DEFAULT/strong/weak/foreground) are available as Tailwind utilities.

### How it works

`hextimator/tailwind.css` contains a `@theme inline` block that maps Tailwind's `--color-*` namespace to bare CSS variables:

```css
@theme inline {
  --color-accent: var(--accent);
  --color-accent-strong: var(--accent-strong);
  /* ...all 20 tokens */
}
```

At runtime, you set the bare variables (`--accent`, `--base`, etc.) on any element — via JavaScript, inline styles, or the React hook — and Tailwind utilities resolve them automatically.

The `inline` keyword means values are resolved where the class is applied, not at `:root`. This enables scoped theming — different parts of the page can have different brand colors.

### Custom roles and variants

If you extend the palette with `addRole()` or `addVariant()`, add the extra tokens to your CSS:

```css
@import "tailwindcss";
@import "hextimator/tailwind.css";

@theme inline {
  --color-cta: var(--cta);
  --color-cta-strong: var(--cta-strong);
  --color-cta-weak: var(--cta-weak);
  --color-cta-foreground: var(--cta-foreground);
}
```

## React

hextimator provides a React hook that generates both light and dark palettes and injects them as CSS variables via a `<style>` tag. Combined with `hextimator/tailwind.css`, this gives you live-updating Tailwind utilities with dark mode support and zero glue code.

```bash
npm install hextimator react
```

### Basic usage

```typescript
import { useHextimator } from "hextimator/react";

function App() {
  useHextimator("#6A5ACD");

  return <div className="bg-accent text-accent-foreground">Themed!</div>;
}
```

By default, both light and dark themes are injected and toggled via `prefers-color-scheme`.

### Dark mode strategies

```typescript
// System preference (default)
useHextimator("#6A5ACD", { darkMode: { type: "media" } });

// Class-based (Tailwind's `dark` class, Next.js, etc.)
useHextimator("#6A5ACD", { darkMode: { type: "class" } });
// → .dark { --accent: ...; }

// Custom class name
useHextimator("#6A5ACD", { darkMode: { type: "class", className: "theme-dark" } });

// Data attribute
useHextimator("#6A5ACD", { darkMode: { type: "data" } });
// → [data-theme="dark"] { --accent: ...; }

// Custom attribute
useHextimator("#6A5ACD", { darkMode: { type: "data", attribute: "data-mode" } });

// Light only, no dark theme
useHextimator("#6A5ACD", { darkMode: false });
```

### CSS prefix

Namespace CSS variables to avoid collisions with other libraries:

```typescript
useHextimator("#6A5ACD", { cssPrefix: "ht-" });
// → --ht-accent, --ht-base, etc.
```

### Scoped theming with `target`

Apply theme variables to a specific element instead of globally:

```typescript
function BrandedSection({ brandColor }: { brandColor: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useHextimator(brandColor, { target: ref });

  return (
    <div ref={ref} className="bg-accent text-accent-foreground">
      This section has its own brand colors.
    </div>
  );
}
```

### With generation and format options

```typescript
useHextimator("#6A5ACD", {
  generation: { minContrastRatio: "AA" },
  format: { colors: "oklch" },
});
```

### With custom roles and variants

```typescript
useHextimator("#6A5ACD", {
  format: { colors: "oklch" },
  configure: (builder) => {
    builder
      .addRole("cta", "#EE2244")
      .addVariant("hover", { beyond: "strong" })
      .addToken("border", { from: "base.weak", lightness: -0.05 });
  },
});
```

### Dynamic theming

The hook re-generates the palette whenever the color changes:

```typescript
function App() {
  const [color, setColor] = useState("#6A5ACD");
  useHextimator(color);

  return (
    <div className="bg-base text-base-foreground">
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      {/* Everything re-themes instantly */}
    </div>
  );
}
```

### Hook options reference

| Option | Type | Default | Description |
|---|---|---|---|
| `darkMode` | `{ type: "media" \| "class" \| "data", ... } \| false` | `{ type: "media" }` | Dark mode strategy |
| `cssPrefix` | `string` | `""` | Prefix for CSS variable names |
| `target` | `RefObject<HTMLElement>` | — | Scope vars to an element instead of injecting a `<style>` tag |
| `generation` | `HextimateGenerationOptions` | — | Palette generation options |
| `format` | `Omit<HextimateFormatOptions, "as">` | — | Color serialization options |
| `configure` | `(builder) => void` | — | Access the builder to add roles, variants, or tokens |

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

## Contributing

Issues and PRs are welcome at [github.com/fgrgic/hextimator](https://github.com/fgrgic/hextimator/issues).
