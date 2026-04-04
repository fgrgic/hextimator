# hextimator

<p align="center">
    <picture>
        <img src="https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/assets/gh-cover.webp?raw=true" alt="hextimator" width="500">
    </picture>
</p>

One brand color in, full accessible theme out.

**[hextimator.com](https://hextimator.com)** — landing page with a playground.

- Input: any single color. Output: complete light + dark theme with accessibility guarantees (AAA contrast by default).
- Works at runtime — built for multi-tenant apps that need per-brand themes on the fly.
- Perceptually uniform (OKLCH) — blue and yellow palettes look equally balanced, unlike HSL-based generators.

## Installation

Add to your project:

```bash
npm i hextimator
```

Or quickly get a one-off theme:

```bash
npx hextimator "#ff6677"
```

## Quick start

```typescript
import { hextimate } from "hextimator";

const theme = hextimate("#6A5ACD").format();
```

### With a preset

Presets configure hextimator for a specific framework in one call:

```typescript
import { hextimate, presets } from "hextimator";

// shadcn/ui — generates --background, --primary, --destructive, etc.
const theme = hextimate("#6366F1")
  .preset(presets.shadcn)
  .format();
```

Presets set sensible defaults but you can override anything in `.format()`:

```typescript
const theme = hextimate("#6366F1")
  .preset(presets.shadcn)
  .format({ colors: "hsl-raw" }); // older shadcn format
```

See [Presets](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/presets.md) for the full list and how to create your own.

## Two-step API: generate, then format

hextimator separates **palette generation** (color math) from **formatting** (output shape). This lets you extend the palette before choosing how to serialize it.

```typescript
const theme = hextimate("#6A5ACD")
  .format({ as: "css", colors: "oklch" });
```

### Output formats

All formats return `{ light: { ... }, dark: { ... } }`.

- **`"object"`** (default) — plain keys: `accent`, `accent-strong`, …
- **`"css"`** — CSS custom properties: `--accent`, `--accent-strong`, …
- **`"tailwind"`** — nested tokens: `{ accent: { DEFAULT, strong, … } }`
- **`"tailwind-css"`** — `@theme` block with `--color-accent`, `--color-accent-strong`, …
- **`"scss"`** — SCSS variables: `$accent`, `$accent-strong`, …
- **`"json"`** — JSON string of the plain object

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

> **Note on alpha**: Alpha values are intentionally ignored — `rgba(255, 0, 0, 0.5)` is treated as fully opaque `rgb(255, 0, 0)`. Alpha tokens undermine accessibility guarantees because contrast ratios depend on the background, which hextimator does not control.

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

## Documentation

- [Extending the palette](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/extending-the-palette.md) — `addRole`, `addVariant`, `addToken`
- [Presets](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/presets.md) — drop-in configs for shadcn/ui, or create your own
- [Multiple themes](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/multiple-themes.md) — dynamic theming and `.fork()`
- [Customization](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/customization.md) — generation and format options reference
- [Color vision deficiency](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/color-vision-deficiency.md) — simulate and adapt for CVD
- [React](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/react.md) — `useHextimator` hook, provider, dark mode strategies
- [Tailwind CSS v4](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/tailwind.md) — setup and usage with Tailwind
- [Real-world examples](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/examples.md) — shadcn/ui, Stripe, Slack configurations

## Contributing

Issues and PRs are welcome at [github.com/fgrgic/hextimator](https://github.com/fgrgic/hextimator/issues).
