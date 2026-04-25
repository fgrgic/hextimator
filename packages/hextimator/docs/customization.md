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
| `light` | `ThemeAdjustments` | (see types) | Per-light-theme overrides: `lightness`, `maxChroma`, `minContrastRatio`, `surfaceMaxChroma`, `foregroundMaxChroma` |
| `dark` | `ThemeAdjustments` | (see types) | Per-dark-theme overrides (same shape as `light`) |
| `minContrastRatio` | `"AAA" \| "AA" \| number` | `"AAA"` | Minimum WCAG contrast ratio between variants and foreground. `"AAA"` = 7, `"AA"` = 4.5, or pass any number |
| `invertDarkModeSurfaceAccent` | `boolean` | `false` | Swap surface and accent hues in dark mode. Requires `surfaceColor` to be set |

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
| `persistentVariants` | `boolean` | `false` | Emit extra `-light` / `-dark` copies of every token that always resolve to that mode's value regardless of dark-mode state. See [Persistent variants](#persistent-variants) |

## Persistent variants

`persistentVariants: true` emits an extra `-light` and `-dark` copy of every token. They always resolve to that mode's value, regardless of the active theme.

Use for sections that should not follow the surrounding dark-mode state: an always-dark navbar, an always-light card inside a dark app, marketing "spotlight" sections, or previews of the opposite mode.

```ts
hextimate("#6A5ACD").format({
  as: "css",
  persistentVariants: true,
  darkMode: "class",
});
```

Produces (abridged):

```css
:root {
  --accent: #6a5acd;
  /* ... normal tokens ... */
  --accent-light: #6a5acd;
  --accent-strong-light: #5a4abc;
  --accent-dark: #9c8fe8;
  --accent-strong-dark: #b3a9ef;
  /* ... -light / -dark for every role and variant ... */
}
.dark {
  --accent: #9c8fe8;
  /* normal tokens flip; -light / -dark are NOT redefined here */
}
```

### Tailwind

Pair with the companion stylesheet so `bg-accent-dark`, `text-surface-foreground-light`, etc. resolve:

```css
@import "hextimator/tailwind.css";
@import "hextimator/tailwind-persistent.css";
```

```jsx
<div className="bg-surface-dark text-surface-foreground-dark">
  Always dark, even in light mode.
</div>
```

### Notes

- Persistent tokens respect `excludeRoles`, `excludeVariants`, `roleNames`, `variantNames`, and `separator` just like regular tokens.
- For per-palette outputs (`object`, `scss`, `json`, `tailwind`), both `result.light` and `result.dark` contain the persistent tokens with identical values.
- For stylesheet outputs, persistent tokens appear only in the root block; the dark-mode wrapper intentionally never redefines them.
- `hextimator/fallback.css` does not include persistent variants. If you rely on the fallback for pre-JS paint, generate a custom fallback with `hextimate(...).format({ as: 'css', persistentVariants: true })` and ship that instead.
- The companion `tailwind-persistent.css` maps the five built-in roles (`surface`, `accent`, `positive`, `negative`, `warning`). Custom roles added via `addRole` work in JSON/CSS output but need their own `@theme inline` mappings to be usable as Tailwind utilities.
