# hextimator

<p align="center">
    <picture>
        <img src="https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/assets/gh-cover.webp?raw=true" alt="hextimator" width="500">
    </picture>
</p>

Per-tenant themes from a single one brand color: Runtime theming for B2B2C and white-label apps.

Your customers pick a brand color. Your app looks good. Every time. No per-customer design reviews, no manual tuning, no edge cases where "that shade of yellow" breaks your UI.

Ship multi-tenant apps without the design overhead:

- **Every color just works**. Perceptually uniform colors with OKLCH means that electric blue looks as balanced as muted olive.
- **Accessible by default**. Every foreground meets AAA contrast against its background, light and dark mode included.

Try it in the playground: **[hextimator.com](https://hextimator.com)**

## Why `hextimator` exists

You're building a B2B, a B2B2C, or a white-label app. Every tenant wants their own brand color in the app. The options today are:

1. **Let customers pick any hex.** It works until a partner's _legal-pad yellow_ renders your buttons unreadable, and their _cheeto dust tangerine_ toast makes it indistinguishable from a warning.
2. **Constrain them to a curated palette.** Now you need to tell a paying customer that their brand color isn't allowed. Or spend hours adjusting all the other colors by hand to make the theme somewhat work.

Hextimator is option 3. One color in, whole theme out. You get accent, semantic roles, light/dark palette, every foreground guaranteed to meet WCAG contrast against its background. Every time. Even for that yellow.

```ts
import { hextimate } from "hextimator";

const tenantTheme = hextimate(tenant.brandColor).format({ as: "css" });

document.getElementById("tenant-theme").textContent = tenantTheme;
```

That's the integration. Swap the color, the theme regenerates at runtime, and the UI stays readable.

Using React? Even easier:

```jsx
<HextimatorProvider defaultColor={tenant.brandColor}>
  <App />
</HextimatorProvider>
```

See full React integration guide [here](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/react.md).

## Installation

Add to your project:

```bash
npm i hextimator
```

Or quickly get a one-off theme:

```bash
npx hextimator "#C0FFEE"
```

## Quick start

```typescript
import { hextimate } from "hextimator";

const theme = hextimate("#C0FFEE").format();
```

### With presets

Presets are partial or full themes. You can chain them together, [extend them](#extending-presets), or not use them at all. They provide a starting point: whether for a specific framework or a particular style:

```typescript
import { hextimate, presets } from "hextimator";

// shadcn/ui tokens
const theme = hextimate("#0FF1CE").preset(presets.shadcn).format();

// muted palette
const theme = hextimate("#0FF1CE").preset(presets.muted).format();

// muted shadcn theme
const theme = hextimate("#0FF1CE")
  .preset(presets.shadcn)
  .preset(presets.muted)
  .format();
```

Presets are applied sequentially (last wins for conflicts) and you can override anything in `.format()`:

```typescript
const theme = hextimate("#BADA55")
  .preset(presets.muted)
  .preset(presets.shadcn)
  .format({ colors: "hsl-raw" }); // override preset's oklch default
```

### Extending presets

Presets can bring their own **`style`** (contrast, chroma, and other generation options). **`.style(partial)`** after **`.preset()`** layers your tweaks on top—options merge along the chain, so you can refine a preset’s look for your product without forking the preset object:

```typescript
const theme = hextimate("#DEC0DE")
  .preset(presets.tinted) // e.g. sets a looser baseMaxChroma
  .style({ baseMaxChroma: 0.01 }) // tighten further for this app
  .preset(presets.shadcn)
  .format();
```

See [Presets](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/presets.md) for the full list, chaining details, and how to create your own.

## Two-step API: generate, then format

hextimator separates **palette generation** (color math) from **formatting** (output shape). This lets you extend the palette before choosing how to serialize it.

```typescript
const theme = hextimate("#0FF5E7").format({ as: "css", colors: "oklch" });
```

### Palette options with `.style()`

**`hextimate` only takes the color.** Everything that steers generation—contrast rules, chroma caps, hue tweaks, light/dark tweaks, and the rest—goes on **`.style(partial)`**. Call it once or stack several calls; each merges into the current options (later wins on the same keys).

```typescript
hextimate("#FACADE")
  .style({ minContrastRatio: "AA", baseMaxChroma: 0.02 })
  .format();
```

Preset **`style`** plus **`.style()`** on the builder is covered in [Extending presets](#extending-presets) above. For every option you can pass, see [Customization](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/customization.md). To reuse the same chain with another accent or options, see [Multiple themes](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/multiple-themes.md) (`.fork()` + `.style()`).

### Filtering output

Use `excludeRoles` and `excludeVariants` in `.format()` (or in a preset's `format` field) to drop tokens you don't need:

```typescript
// Drop the warning role and the strong/weak variants entirely
hextimate("#F11732").format({
  excludeRoles: ["warning"],
  excludeVariants: ["strong", "weak"],
});

// Useful in custom presets to keep output tight
const myPreset: HextimatePreset = {
  format: {
    excludeRoles: ["warning"],
    excludeVariants: ["weak"],
  },
};
```

Both options use internal names (before any `roleNames`/`variantNames` remapping).

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

Besides hex, **`hextimate`** accepts CSS color strings, RGB tuples, and numeric `0xRRGGBB`—anything **`parseColor`** understands.

> **Note on alpha**: Alpha values are intentionally ignored — `rgba(255, 0, 0, 0.5)` is treated as fully opaque `rgb(255, 0, 0)`. Alpha tokens undermine accessibility guarantees because contrast ratios depend on the background, which hextimator does not control. You can always add an opacity modifier later if you wish (e.g. `base-accent-weak/20` in tailwind).

Before `.format()` you can still chain **`addRole` / `addVariant` / `addToken`**, **`.preset()`**, **`.fork()`**, **`.simulate()` / `.adaptFor()`**, and anything else in [Extending the palette](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/extending-the-palette.md) or [Presets](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/presets.md).

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

- [Migrating from 0.2.x](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migrating-from-0.2.md) — breaking changes for 0.3.0
- [Extending the palette](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/extending-the-palette.md) — `addRole`, `addVariant`, `addToken`
- [Presets](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/presets.md) — drop-in configs for shadcn/ui, or create your own
- [Multiple themes](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/multiple-themes.md) — dynamic theming and `.fork()`
- [Customization](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/customization.md) — style and format options reference
- [Color vision deficiency](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/color-vision-deficiency.md) — simulate and adapt for CVD
- [React](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/react.md) — hook, `HextimatorStyle`, provider, scoped themes, dark mode
- [Tailwind CSS v4](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/tailwind.md) — setup and usage with Tailwind
- [Real-world examples](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/examples.md) — shadcn/ui, Stripe, Slack configurations

## Contributing

Issues and PRs are welcome at [github.com/fgrgic/hextimator](https://github.com/fgrgic/hextimator/issues).
