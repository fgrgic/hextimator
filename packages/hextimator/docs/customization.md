# Customization

## Style options

Passed to `.style()` on the palette builder (and to the `style` field on presets, or the React `style` prop). **HextimateStyleOptions** is **[`ThemeAdjustments`](#themeadjustments)** (set fields at the top level for both themes) plus the extra options in the table below.

| Option                        | Type                                    | Default | Description                                                                                                          |
| ----------------------------- | --------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `light`                       | [`ThemeAdjustments`](#themeadjustments) | —       | Per-light-theme overrides (same fields as `ThemeAdjustments`; omitted keys inherit from the top-level style object). |
| `dark`                        | [`ThemeAdjustments`](#themeadjustments) | —       | Per-dark-theme overrides (same as `light`).                                                                          |
| `invertDarkModeSurfaceAccent` | `boolean`                               | `false` | Swap surface and accent hues in dark mode. Requires `surfaceColor` on the invert path (top-level or under `dark`).   |

### `ThemeAdjustments`

Generation knobs. You can set any of these at the **top level** of `.style()` for both themes, or under **`light` / `dark`** to override that theme only; omitted nested keys keep the top-level value.

| Field                 | Type                                 | Default (when not set)                                                                                                                     | Description                                                                                                        |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `baseLightness`       | `number` (0-1)                       | Brand color OKLCH **L**, clamped via `baseLightnessRange` (per-theme, then top-level, then built-ins: light `[0.4,0.9]`, dark `[0.2,0.8]`) | Absolute lightness anchor for accent fills (not `addToken({ lightness })` offsets).                                |
| `lightness`           | `number` (0-1)                       | —                                                                                                                                          | **Deprecated** (use `baseLightness`). Still read under `light` / `dark` only for backwards compatibility.          |
| `maxChroma`           | `number`                             | No extra cap                                                                                                                               | Max chroma for accent and semantic fills in scope; higher values are clamped.                                      |
| `baseLightnessRange`  | `[min, max]` (OKLCH **L**, 0-1 each) | Built-in range per theme, unless top-level sets this tuple                                                                                 | Clamps `baseLightness` and input-derived anchors. Under `light` / `dark`, overrides top-level for that theme only. |
| `minContrastRatio`    | `"AAA" \| "AA" \| number`            | `"AAA"` (= 7) at top level; nested inherits top-level                                                                                      | Minimum WCAG contrast between non-foreground variants and foreground. `"AA"` = 4.5, or pass a number.              |
| `surfaceMaxChroma`    | `number`                             | `0.01` (top-level); nested inherits top-level                                                                                              | Max chroma for surface scale (`surface`, `strong`, `weak`).                                                        |
| `foregroundMaxChroma` | `number`                             | `0.01` (top-level); nested inherits top-level                                                                                              | Max chroma for foreground variants (e.g. `accent-foreground`).                                                     |
| `surfaceColor`        | `ColorInput`                         | Low-chroma derivation from the brand color (top-level); nested inherits top-level                                                          | Surface baseline for this scope. Per-theme: `light.surfaceColor` / `dark.surfaceColor`.                            |
| `surfaceHueShift`     | `number` (degrees)                   | `0` (top-level); nested inherits top-level                                                                                                 | Rotate surface hue vs accent. **Ignored** when `surfaceColor` is set for that scope.                               |
| `hueShift`            | `number` (degrees)                   | `0` (top-level); nested inherits top-level                                                                                                 | Per-variant hue shift on accent and semantic scales (strong/weak steps).                                           |
| `semanticColors`      | `{ positive?, negative?, caution? }` | Auto-filled from seed (top-level); under `light` / `dark`, each key merges with top-level                                                  | Explicit semantic role colors. Unset slots inherit.                                                                |
| `semanticColorRanges` | `{ positive?, negative?, caution? }` | `positive: [120,160]`, `negative: [5,30]`, `caution: [45,70]` (after top-level + merge)                                                    | OKLCH hue arcs for discovering semantic bases. Per-theme keys merge with top-level.                                |

## Format options

Passed to `.format()` - these affect the output shape.

| Option             | Type                                                                                              | Default        | Description                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `as`               | `"object" \| "css" \| "tailwind" \| "tailwind-css" \| "scss" \| "json"`                           | `"object"`     | Output format (see [Output formats](#output-formats))                                                                                                              |
| `colors`           | `"hex" \| "rgb" \| "rgb-raw" \| "hsl" \| "hsl-raw" \| "oklch" \| "oklch-raw" \| "p3" \| "p3-raw"` | `"hex"`        | Color value serialization (see [Color value formats](#color-value-formats))                                                                                        |
| `roleNames`        | `Record<string, string>`                                                                          | Built-in names | Rename roles in output keys (e.g. `{ accent: "brand", surface: "background" }`)                                                                                                |
| `variantNames`     | `Record<string, string>`                                                                          | Built-in names | Rename variant suffixes in output keys (e.g. `{ strong: "primary", foreground: "text" }`)                                                                                      |
| `separator`        | `string`                                                                                          | `"-"`          | Separator between role and variant in token keys                                                                                                                               |
| `keyPrefix`        | `string`                                                                                          | `""`           | Prepended to each flat key for `as: "object"` and `as: "json"` only (e.g. `"--"` for CSS custom property names). Ignored for `scss`, nested `tailwind`, and stylesheet outputs |
| `excludeRoles`     | `string[]`                                                                                        | `[]`           | Role keys to omit from the output entirely (internal names, before `roleNames`)                                                                                                |
| `excludeVariants`  | `string[]`                                                                                        | `[]`           | Variant keys to omit from every role's output (internal names, before `variantNames`)                                                                                          |
| `darkMode`         | `"media" \| "class" \| "data-attribute" \| false`                                                 | `"media"`      | Dark-mode strategy for stylesheet outputs (`as: 'css'`, `as: 'tailwind-css'`)                                                                                                  |
| `selector`         | `string`                                                                                          | `":root"`      | Root selector for `as: 'css'` output                                                                                                                                           |
| `invertedVariants` | `boolean`                                                                                         | `false`        | Emit an extra `-inverted` copy of every token whose value is the opposite mode's. Flips with the active mode. See [Inverted variants](#inverted-variants)                      |

### Output formats

All formats return `{ light: { ... }, dark: { ... } }`.

- **`"object"`** (default) — plain keys: `accent`, `accent-strong`, … Optional **`keyPrefix: "--"`** gives `--accent`, `--accent-strong`, … when you need CSS-style names without stylesheet output.
- **`"css"`** — CSS custom properties: `--accent`, `--accent-strong`, …
- **`"tailwind"`** — nested tokens: `{ accent: { DEFAULT, strong, … } }`
- **`"tailwind-css"`** — `@theme` block with `--color-accent`, `--color-accent-strong`, …
- **`"scss"`** — SCSS variables: `$accent`, `$accent-strong`, …
- **`"json"`** — JSON string of the plain object (supports **`keyPrefix`** the same way as **`object`**)

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

### Flexible color input

Besides hex, **`hextimate`** accepts CSS color strings, RGB tuples, and numeric `0xRRGGBB` — anything **`parseColor`** understands.

> **Note on alpha**: Alpha values are intentionally ignored — `rgba(255, 0, 0, 0.5)` is treated as fully opaque `rgb(255, 0, 0)`. Alpha tokens undermine accessibility guarantees because contrast ratios depend on the background, which hextimator does not control. You can add opacity modifiers in your UI layer when needed.

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
  --accent-inverted: #9c8fe8; /* dark value while in light mode */
  --accent-strong-inverted: #b3a9ef;
  /* ... -inverted for every role and variant ... */
}
.dark {
  --accent: #9c8fe8;
  /* ... */
  --accent-inverted: #6a5acd; /* light value while in dark mode */
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
{
  /* One class, flips with mode */
}
<section className='bg-surface-inverted text-surface-foreground-inverted'>
  Contrast section: dark on a light page, light on a dark page.
</section>;
```

### Always-dark or always-light sections

Inverted tokens compose with Tailwind's `dark:` variant to lock a section to one mode:

```jsx
{
  /* Always dark: inverted in light mode + regular in dark mode = always dark */
}
<nav
  className='
    bg-surface-inverted dark:bg-surface
    text-surface-foreground-inverted dark:text-surface-foreground
  '
>
  Always-dark navbar.
</nav>;

{
  /* Always light: regular in light mode + inverted in dark mode = always light */
}
<aside
  className='
    bg-surface dark:bg-surface-inverted
    text-surface-foreground dark:text-surface-foreground-inverted
  '
>
  Always-light card on a dark app.
</aside>;
```

### Notes

- Inverted tokens respect `excludeRoles`, `excludeVariants`, `roleNames`, `variantNames`, `separator`, and `keyPrefix` just like regular tokens.
- For per-palette outputs (`object`, `scss`, `json`, `tailwind`), `result.light['accent-inverted']` equals `result.dark.accent`, and vice versa.
- For stylesheet outputs the inverted tokens appear in both the root and dark-mode blocks with swapped values, using normal CSS cascade.
- With `darkMode: false`, only the root block is emitted and `-inverted` simply holds the dark palette's values (a useful "give me dark colors in a light-only app" escape hatch).
- `hextimator/fallback.css` does not include inverted variants. If you rely on the fallback for pre-JS paint, generate a custom fallback with `hextimate(...).format({ as: 'css', invertedVariants: true })` and ship that instead.
- The companion `tailwind-inverted.css` maps the five built-in roles (`surface`, `accent`, `positive`, `negative`, `caution`). Custom roles added via `addRole` need their own `@theme inline` mappings to be usable as Tailwind utilities.
