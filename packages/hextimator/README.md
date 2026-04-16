# hextimator

<p align="center">
    <picture>
        <img src="https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/assets/gh-cover.webp?raw=true" alt="hextimator" width="500">
    </picture>
</p>

One color in, whole theme out.

Your customers pick a brand color. Your app looks good. Every time. No manual tuning, no edge cases where "that shade of yellow" breaks your UI.

- **Ship white-labeling without the design overhead** — generate per-tenant branded themes at runtime from a single input color. No design review per customer.
- **Every color just works** — perceptually uniform colors with OKLCH means that electric blue looks as balanced as muted olive.
- **Accessible by default** — every foreground meets AAA contrast against its background, light and dark mode included.

**[hextimator.com](https://hextimator.com)** — try it in the playground.

## Installation

Add to your project:

```bash
npm i hextimator
```

Or quickly get a one-off theme:

```bash
npx hextimator "#FF6677"
```

## Quick start

```typescript
import { hextimate } from "hextimator";

const theme = hextimate("#C0FFEE").format();
```

### With presets

Presets are predefined configurations you can use as a starting point: whether for a specific framework or a particular style:

```typescript
import { hextimate, presets } from "hextimator";

// Framework preset -- shadcn/ui tokens
const theme = hextimate("#DEC0DE").preset(presets.shadcn).format();

// Style preset -- muted palette
const theme = hextimate("#BADA55").preset(presets.muted).format();

// Chain them -- muted shadcn theme
const theme = hextimate("#0FF1CE")
  .preset(presets.shadcn)
  .preset(presets.muted)
  .format();
```

Presets are applied sequentially (last wins for conflicts) and you can override anything in `.format()`:

```typescript
const theme = hextimate("#FACADE")
  .preset(presets.muted)
  .preset(presets.shadcn)
  .format({ colors: "hsl-raw" }); // override preset's oklch default
```

See [Presets](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/presets.md) for the full list, chaining details, and how to create your own.

## Two-step API: generate, then format

hextimator separates **palette generation** (color math) from **formatting** (output shape). This lets you extend the palette before choosing how to serialize it.

```typescript
const theme = hextimate("#0FF5E7").format({ as: "css", colors: "oklch" });
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

| `colors`          | Example output                       |
| ----------------- | ------------------------------------ |
| `"hex"` (default) | `"#6a5acd"`                          |
| `"oklch"`         | `"oklch(0.54 0.18 276)"`             |
| `"oklch-raw"`     | `"0.54 0.18 276"`                    |
| `"rgb"`           | `"rgb(106, 90, 205)"`                |
| `"rgb-raw"`       | `"106 90 205"`                       |
| `"hsl"`           | `"hsl(248, 53%, 58%)"`               |
| `"hsl-raw"`       | `"248 53% 58%"`                      |
| `"p3"`            | `"color(display-p3 0.39 0.34 0.79)"` |
| `"p3-raw"`        | `"0.39 0.34 0.79"`                   |

### Flexible input

```typescript
hextimate("#FF6666"); // hex string
hextimate("rgb(255, 102, 102)"); // CSS function
hextimate([255, 102, 102]); // RGB tuple
hextimate(0xff6666); // numeric hex
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

## React

Import from `hextimator/react`:

- **`HextimatorProvider`** and **`useHextimatorTheme()`** — context for color, dark mode, palette, and builder configuration; the provider injects CSS via `useHextimator` internally.
- **`useHextimator`** or **`HextimatorStyle`** — simpler surface, no context: emit CSS only (hook uses `document.head` or `target`; component renders `<style>`, optional **`selector`** for scoping, handy for SSR/RSC).
- **`HextimatorScope`** — subtree theming and nested context; **inherits** custom shape from the parent **`builder`** via **`fork()`**.

See **[React (full guide)](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/react.md)** for dark mode strategies, examples, and API tables.

### `fallback.css`

Pre-JS placeholder: neutral values for the same variables as default `hextimate()` (and `hextimator/tailwind.css`). Use in **client-rendered** apps so the first paint is not missing `--accent`, `--base`, etc. before your bundle runs; runtime theme CSS then replaces them. Import **before** `tailwind.css` if you use it.

```css
@import "hextimator/fallback.css";
@import "hextimator/tailwind.css";
```

Does not match **preset-only** token names (e.g. shadcn); use the CLI to generate a static file for those.

## Documentation

- [Extending the palette](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/extending-the-palette.md) — `addRole`, `addVariant`, `addToken`
- [Presets](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/presets.md) — drop-in configs for shadcn/ui, or create your own
- [Multiple themes](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/multiple-themes.md) — dynamic theming and `.fork()`
- [Customization](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/customization.md) — generation and format options reference
- [Color vision deficiency](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/color-vision-deficiency.md) — simulate and adapt for CVD
- [React](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/react.md) — hook, `HextimatorStyle`, provider, scoped themes, dark mode
- [Tailwind CSS v4](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/tailwind.md) — setup and usage with Tailwind
- [Real-world examples](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/examples.md) — shadcn/ui, Stripe, Slack configurations

## Contributing

Issues and PRs are welcome at [github.com/fgrgic/hextimator](https://github.com/fgrgic/hextimator/issues).
