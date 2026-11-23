# Themes

A theme describes what your brand color turns into. The accent stays a separate input, so one theme serves every tenant.

```ts
hextimate(accent).format(); // default theme
hextimate(accent, theme).format(); // your theme
```

A `ThemeDefinition` is plain data, so you can store it in a database or load it from a CMS.

## Fields

| Field          | What it does                                                         |
| -------------- | -------------------------------------------------------------------- |
| `style`        | Contrast, chroma, lightness, and hue settings. See [Style](#style).  |
| `roles`        | Roles to generate. The key sets the output name.                     |
| `variants`     | Extra variants added to every role.                                  |
| `tokens`       | Standalone tokens.                                                   |
| `variantNames` | Renames variant suffixes, such as `{ foreground: "contrastText" }`.  |
| `format`       | Default output options. `.format()` options override them. See [Format](#format). |

Every field is optional. A theme without `roles` produces no roles.

## Style

Style shapes the look of every token: contrast, colorfulness, lightness, and how far surfaces drift from the accent. Set an option at the top level for both modes, or under `light` or `dark` for one.

```ts
style: {
  minContrastRatio: "AA",
  surfaceHueShift: 160,
  light: { baseLightness: 0.6 },
}
```

| Option                        | Type                                    | Default | Description                                                                                                          |
| ----------------------------- | --------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `light`                       | [`ThemeAdjustments`](#themeadjustments) | -       | Per-light-theme overrides (same fields as `ThemeAdjustments`; omitted keys inherit from the top-level style object). |
| `dark`                        | [`ThemeAdjustments`](#themeadjustments) | -       | Per-dark-theme overrides (same as `light`).                                                                          |
| `invertDarkModeSurfaceAccent` | `boolean`                               | `false` | Swap surface and accent hues in dark mode. Requires `surfaceColor` on the invert path (top-level or under `dark`).   |

#### `ThemeAdjustments`

Generation knobs. You can set any of these at the **top level** of `style` for both themes, or under **`light` / `dark`** to override that theme only; omitted nested keys keep the top-level value.

| Field                 | Type                                 | Default (when not set)                                                                                                                     | Description                                                                                                        |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `baseLightness`       | `number` (0-1)                       | Brand color OKLCH **L**, clamped via `baseLightnessRange` (per-theme, then top-level, then built-ins: light `[0.4,0.9]`, dark `[0.2,0.8]`) | Absolute lightness anchor for accent fills (not the relative `lightness` offset on tokens).                                |
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

## Roles

A role is one of three shapes:

```ts
roles: {
  // A built-in generator: surface, accent, positive, negative, or caution
  surface: { generate: "surface" },
  brand: { generate: "accent" },

  // A fixed color
  cta: { color: "#ee2244" },

  // Derived from another role. hue rotates in OKLCH degrees.
  secondary: { from: "brand", hue: 180 },
}
```

Every role gets `DEFAULT`, `strong`, `weak`, `foreground`, and `foreground-weak`, plus any theme `variants`.

The surface also gets readable colored text for every other role: `surface-foreground-brand`, `surface-foreground-cta`, and so on. Each meets `minContrastRatio` on the surface's DEFAULT, weak, and strong.

Any generator except `surface` can appear more than once. A second `surface` throws.

## Variants

A variant adds a step to every role:

```ts
variants: [
  { name: "hover", placement: { from: "strong" } }, // one step past strong
  { name: "subtle", placement: { from: "weak" } }, // one step past weak
  { name: "soft", placement: { between: ["DEFAULT", "weak"] } }, // midpoint
]
```

`from` can also name an earlier custom variant, such as `{ from: "hover" }`.

## Tokens

A token is a single value:

```ts
tokens: [
  { name: "ring", value: { from: "accent" } },
  { name: "border", value: { from: "surface.weak", lightness: -0.05 } },
  { name: "muted-text", value: { from: "surface.foreground", emphasis: -0.3 } },
  { name: "logo", value: "#FF6600" },
  { name: "page", value: { light: "#ffffff", dark: "#1a1a1a" } },
  { name: "surface.strong", value: "#fafafa" },
]
```

- `from` takes `role` or `role.variant`.
- `lightness`, `chroma`, and `hue` are fixed offsets in OKLCH.
- `emphasis` moves toward more contrast (positive) or less (negative). It flips between light and dark, so one value works in both.
- `{ light, dark }` sets a value per mode.
- A dotted name such as `surface.strong` overrides a generated color before anything derives from it. A kebab name that matches a generated token, such as `surface-strong`, throws.
- `{ generate: "brand-exact" }` is your input color unchanged. `{ generate: "brand-exact-foreground" }` is readable text on it.

## Order

hextimator applies a theme in a fixed order: generated roles, then other roles, then variants, then tokens. A derived role can reference only the built-in variants. Tokens can reference any variant.

## Extending

Spread a theme and override fields. The last value of each field wins. Arrays and `roles` replace the whole field, so spread the base values to keep them:

```ts
const theme = {
  ...themes.shadcn,
  style: themes.muted.style,
  tokens: [...themes.shadcn.tokens, { name: "sidebar", value: { from: "surface.weak" } }],
} satisfies ThemeDefinition;
```

## Format

Set defaults in the theme's `format`, or pass options to `.format()`.

| Option             | Type                                                                                              | Default        | Description                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `as`               | `"object" \| "css" \| "tailwind" \| "tailwind-css" \| "scss" \| "json"`                           | `"object"`     | Output format (see [Output formats](#output-formats))                                                                                                              |
| `colors`           | `"hex" \| "rgb" \| "rgb-raw" \| "hsl" \| "hsl-raw" \| "oklch" \| "oklch-raw" \| "p3" \| "p3-raw"` | `"hex"`        | Color value serialization (see [Color value formats](#color-value-formats))                                                                                        |
| `variantNames`     | `Record<string, string>`                                                                          | Built-in names | Rename variant suffixes in output keys (e.g. `{ strong: "primary", foreground: "text" }`)                                                                                      |
| `separator`        | `string`                                                                                          | `"-"`          | Separator between role and variant in token keys                                                                                                                               |
| `keyPrefix`        | `string`                                                                                          | `""`           | Prepended to each flat key for `as: "object"` and `as: "json"` only (e.g. `"--"` for CSS custom property names). Ignored for `scss`, nested `tailwind`, and stylesheet outputs |
| `excludeRoles`     | `string[]`                                                                                        | `[]`           | Role keys to omit from the output entirely                                                                                                                                       |
| `excludeVariants`  | `string[]`                                                                                        | `[]`           | Variant keys to omit from every role's output (internal names, before `variantNames`)                                                                                          |
| `darkMode`         | `"media" \| "class" \| "data-attribute" \| false`                                                 | `"media"`      | Dark-mode strategy for stylesheet outputs (`as: 'css'`, `as: 'tailwind-css'`)                                                                                                  |
| `theme`            | `"light" \| "dark" \| "both"`                                                                     | `"both"`       | Palettes included in stylesheet outputs. `"dark"` emits dark tokens directly in the root block                                                                                |
| `selector`         | `string`                                                                                          | `":root"`      | Root selector for `as: 'css'` output                                                                                                                                           |
| `invertedVariants` | `boolean`                                                                                         | `false`        | Emit an extra `-inverted` copy of every token whose value is the opposite mode's. Flips with the active mode. See [Inverted variants](#inverted-variants)                      |

For a dark-only stylesheet, set `theme: "dark"`. Dark tokens are emitted directly in `:root` for `css` or `@theme` for `tailwind-css`, without a media query or selector override. `darkMode: false` remains supported as a legacy alias for `theme: "light"`.

For a dark-only stylesheet, set `theme: "dark"`.

### Output formats

All formats return `{ light, dark }`, except the stylesheet formats, which return one string.

- `"object"` (default): flat keys such as `accent-strong`. Add `keyPrefix: "--"` for CSS-style names.
- `"css"`: a stylesheet with `--accent`, `--accent-strong`, ...
- `"tailwind"`: nested tokens, `{ accent: { DEFAULT, strong, ... } }`
- `"tailwind-css"`: a Tailwind `@theme` block with `--color-accent`, ...
- `"scss"`: `$accent`, `$accent-strong`, ...
- `"json"`: the flat object as a JSON string

### Color formats

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

`hextimate` accepts hex, CSS color strings, RGB tuples, and numeric `0xRRGGBB`.

hextimator ignores alpha. `rgba(255, 0, 0, 0.5)` becomes `rgb(255, 0, 0)`. Contrast depends on the background behind a color, which hextimator cannot know. Add opacity in your UI layer if you need it.

### Inverted variants

`invertedVariants: true` adds an `-inverted` copy of every token with the opposite mode's value. Use it for sections that contrast with the page, such as a dark band on a light site.

```html
<section class="bg-surface-inverted text-surface-foreground-inverted">...</section>
```

With Tailwind, also import `hextimator/tailwind-inverted.css`, or generate aliases with `tailwindAliases(theme, { inverted: true })`.

## Forking

`.fork(color?)` copies a builder, including any CVD adaptation, with an optional new accent.
