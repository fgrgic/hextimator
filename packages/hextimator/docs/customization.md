# Customization

## Style options

Passed to `.style()` on the palette builder (and to the `style` field on presets, or the React `style` prop). These control how colors are generated from the input color.

| Option | Type | Default | Description |
|---|---|---|---|
| `surfaceColor` | `ColorInput` | Auto-generated from input color with very low chroma | Surface color used as baseline for generating the rest of the surface scale |
| `surfaceHueShift` | `number` (degrees) | `0` | Rotate surface hue relative to accent. Ignored when `surfaceColor` is set |
| `hueShift` | `number` (degrees) | `0` | Per-variant hue rotation across the palette |
| `semanticColors` | `{ positive?: color, negative?: color, warning?: color }` | Auto-generated from seed | Override specific semantic colors instead of deriving them |
| `semanticColorRanges` | `{ positive?: [start, end], ... }` | `positive: [135,160]`, `negative: [5,25]`, `warning: [45,65]` | Hue degree ranges for finding semantic colors. Ranges are clockwise arcs; `[350, 10]` wraps through 0°. |
| `surfaceMaxChroma` | `number` | `0.01` | Max chroma for surface colors (higher = more colorful) |
| `foregroundMaxChroma` | `number` | `0.01` | Max chroma for foreground colors (higher = more colorful) |
| `light` | [`ThemeAdjustments`](#themeadjustments) | — | Per-light-theme overrides.  |
| `dark` | [`ThemeAdjustments`](#themeadjustments) | — | Per-dark-theme overrides (same shape as `light`) |
| `minContrastRatio` | `"AAA" \| "AA" \| number` | `"AAA"` | Minimum WCAG contrast ratio between variants and foreground. `"AAA"` = 7, `"AA"` = 4.5, or pass any number |
| `invertDarkModeSurfaceAccent` | `boolean` | `false` | Swap surface and accent hues in dark mode. Requires `surfaceColor` to be set |

### `ThemeAdjustments`

Fields on `HextimateStyleOptions.light` and `.dark` (see `ThemeAdjustments` in `hextimator`’s public types). All properties are optional; unset fields inherit from the parent `HextimateStyleOptions` or the library defaults.

| Field | Type | Default (when not set) | Description |
| --- | --- | --- | --- |
| `baseLightness` | `number` (0–1) | `0.7` (light) / `0.6` (dark) for generation | OKLCH lightness anchor for this theme’s accent (baseline the palette is built around) |
| `maxChroma` | `number` | Global / generator default | Max chroma for accent and semantic colors in this theme; higher chroma is clamped |
| `minContrastRatio` | `"AAA" \| "AA" \| number` | Inherits from top-level `minContrastRatio` | Minimum WCAG contrast for this theme only (`"AAA"` = 7, `"AA"` = 4.5) |
| `surfaceMaxChroma` | `number` | Inherits from top-level `surfaceMaxChroma` | Max chroma for surface (`surface`, `strong`, `weak`) in this theme |
| `foregroundMaxChroma` | `number` | Inherits from top-level `foregroundMaxChroma` | Max chroma for foreground colors in this theme |

## Format options

Passed to `.format()` — these affect the output shape.

| Option | Type | Default | Description |
|---|---|---|---|
| `as` | `"object" \| "css" \| "tailwind" \| "tailwind-css" \| "scss" \| "json"` | `"object"` | Output format (see [Output formats](../README.md#output-formats)) |
| `colors` | `"hex" \| "rgb" \| "rgb-raw" \| "hsl" \| "hsl-raw" \| "oklch" \| "oklch-raw" \| "p3" \| "p3-raw"` | `"hex"` | Color value serialization (see [Color value formats](../README.md#color-value-formats)) |
| `roleNames` | `Record<string, string>` | Built-in names | Rename roles in output keys (e.g. `{ accent: "brand", surface: "background" }`) |
| `variantNames` | `Record<string, string>` | Built-in names | Rename variant suffixes in output keys (e.g. `{ strong: "primary", foreground: "text" }`) |
| `separator` | `string` | `"-"` | Separator between role and variant in token keys |
| `excludeRoles` | `string[]` | `[]` | Role keys to omit from the output entirely (internal names, before `roleNames`) |
| `excludeVariants` | `string[]` | `[]` | Variant keys to omit from every role's output (internal names, before `variantNames`) |
| `darkMode` | `"media" \| "class" \| "data-attribute" \| false` | `"media"` | Dark-mode strategy for stylesheet outputs (`as: 'css'`, `as: 'tailwind-css'`) |
| `selector` | `string` | `":root"` | Root selector for `as: 'css'` output |
| `invertedVariants` | `boolean` | `false` | Emit an extra `-inverted` copy of every token whose value is the opposite mode's. Flips with the active mode. See [Inverted variants](#inverted-variants) |

## Inverted variants

`invertedVariants: true` emits an extra `-inverted` copy of every token. The value is the opposite mode's value: in light mode `--accent-inverted` holds the dark accent; in dark mode it holds the light accent. Inverted tokens flip with the active mode just like regular tokens, so a single class gives you a "contrast" section that always inverts.

Use for sections that intentionally contrast with their surroundings: testimonials, alternating stripes, hero callouts, "spotlight" panels, opposite-mode previews.

```ts
hextimate("#6A5ACD").format({
  as: "css",
  invertedVariants: true,
  darkMode: "class",
});
```

Produces (abridged):

```css
:root {
  --accent: #6a5acd;
  /* ... normal tokens ... */
  --accent-inverted: #9c8fe8;     /* dark value while in light mode */
  --accent-strong-inverted: #b3a9ef;
  /* ... -inverted for every role and variant ... */
}
.dark {
  --accent: #9c8fe8;
  /* ... */
  --accent-inverted: #6a5acd;     /* light value while in dark mode */
  --accent-strong-inverted: #5a4abc;
}
```

### Tailwind

Pair with the companion stylesheet so `bg-accent-inverted`, `text-surface-foreground-inverted`, etc. resolve:

```css
@import "hextimator/tailwind.css";
@import "hextimator/tailwind-inverted.css";
```

```jsx
{/* One class, flips with mode */}
<section className="bg-surface-inverted text-surface-foreground-inverted">
  Contrast section: dark on a light page, light on a dark page.
</section>
```

### Always-dark or always-light sections

Inverted tokens compose with Tailwind's `dark:` variant to lock a section to one mode:

```jsx
{/* Always dark: inverted in light mode + regular in dark mode = always dark */}
<nav
  className="
    bg-surface-inverted dark:bg-surface
    text-surface-foreground-inverted dark:text-surface-foreground
  "
>
  Always-dark navbar.
</nav>

{/* Always light: regular in light mode + inverted in dark mode = always light */}
<aside
  className="
    bg-surface dark:bg-surface-inverted
    text-surface-foreground dark:text-surface-foreground-inverted
  "
>
  Always-light card on a dark app.
</aside>
```

### Notes

- Inverted tokens respect `excludeRoles`, `excludeVariants`, `roleNames`, `variantNames`, and `separator` just like regular tokens.
- For per-palette outputs (`object`, `scss`, `json`, `tailwind`), `result.light['accent-inverted']` equals `result.dark.accent`, and vice versa.
- For stylesheet outputs the inverted tokens appear in both the root and dark-mode blocks with swapped values, using normal CSS cascade.
- With `darkMode: false`, only the root block is emitted and `-inverted` simply holds the dark palette's values (a useful "give me dark colors in a light-only app" escape hatch).
- `hextimator/fallback.css` does not include inverted variants. If you rely on the fallback for pre-JS paint, generate a custom fallback with `hextimate(...).format({ as: 'css', invertedVariants: true })` and ship that instead.
- The companion `tailwind-inverted.css` maps the five built-in roles (`surface`, `accent`, `positive`, `negative`, `warning`). Custom roles added via `addRole` need their own `@theme inline` mappings to be usable as Tailwind utilities.
