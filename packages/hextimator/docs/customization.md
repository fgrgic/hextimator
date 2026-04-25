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
| `light` | `ThemeAdjustments` | (see types) | Per-light-theme overrides: `baseLightness`, `maxChroma`, `minContrastRatio`, `surfaceMaxChroma`, `foregroundMaxChroma` |
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
