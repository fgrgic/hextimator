# Customization

## Generation options

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

## Format options

Passed to `.format()` — these affect the output shape.

| Option | Type | Default | Description |
|---|---|---|---|
| `as` | `"object" \| "css" \| "tailwind" \| "tailwind-css" \| "scss" \| "json"` | `"object"` | Output format (see [Output formats](../README.md#output-formats)) |
| `colors` | `"hex" \| "rgb" \| "rgb-raw" \| "hsl" \| "hsl-raw" \| "oklch" \| "oklch-raw" \| "p3" \| "p3-raw"` | `"hex"` | Color value serialization (see [Color value formats](../README.md#color-value-formats)) |
| `roleNames` | `Record<string, string>` | Built-in names | Rename roles in output keys (e.g. `{ accent: "brand", base: "surface" }`) |
| `variantNames` | `Record<string, string>` | Built-in names | Rename variant suffixes in output keys (e.g. `{ strong: "primary", foreground: "text" }`) |
| `separator` | `string` | `"-"` | Separator between role and variant in token keys |
