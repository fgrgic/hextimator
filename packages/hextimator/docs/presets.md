# Built-in themes

hextimator ships ready-made themes. Each is a plain `ThemeDefinition`, so you can use it as is or spread it into your own.

```ts
import { hextimate, themes } from "hextimator";

hextimate("#6366F1", themes.shadcn).format();
```

| Theme     | Kind      | What you get                                                                                            |
| --------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `shadcn`  | Framework | shadcn/ui CSS variables (`--primary`, `--muted`, charts, ...). Defaults: `as: "css"`, `colors: "oklch"`. |
| `mui`     | Framework | MUI palette object (`primary.main`, `background.default`, ...). Defaults: `as: "object"`, `colors: "hex"`. |
| `muted`   | Style     | Desaturated accent and near-neutral foregrounds. Calm products.                                         |
| `vibrant` | Style     | Higher chroma, complementary-tinted neutrals, slight hue shift on variants.                             |
| `tinted`  | Style     | Surfaces and foregrounds carry the accent hue instead of gray.                                          |
| `bold`    | Style     | Darker accents on light themes, lighter on dark. Higher chroma on neutrals.                             |

Style themes are `baseTheme` with a different `style`. Framework themes add tokens, `variantNames`, and `format` defaults.

## shadcn

Drop-in for [shadcn/ui](https://ui.shadcn.com). Generates `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--card`, `--popover`, `--border`, `--input`, `--ring`, `--chart-1` to `--chart-5`, plus `-foreground` counterparts.

For older shadcn setups that use HSL:

```ts
hextimate("#6366F1", themes.shadcn).format({ colors: "hsl-raw" });
```

## mui

Matches [MUI's](https://mui.com) theme structure. Generates `primary`, `secondary`, `error`, `warning`, `info`, `success`, each with `main`, `light`, `dark`, and `contrastText`. Also generates `background` (`default`, `paper`), `text` (`primary`, `secondary`, `disabled`), `divider`, and `action` tokens.

```ts
import { createTheme } from "@mui/material/styles";

const palette = hextimate("#6366F1", themes.mui).format();

const theme = createTheme({ palette: palette.light });
```

## Combining themes

Spread one theme into another. To give shadcn a muted look:

```ts
const theme = {
  ...themes.shadcn,
  style: themes.muted.style,
} satisfies ThemeDefinition;
```

Tune a style further by spreading it:

```ts
const theme = {
  ...themes.shadcn,
  style: { ...themes.tinted.style, surfaceMaxChroma: 0.01 },
} satisfies ThemeDefinition;
```

Add your own tokens on top:

```ts
const theme = {
  ...themes.shadcn,
  tokens: [
    ...themes.shadcn.tokens,
    { name: "sidebar", value: { from: "surface.weak" } },
  ],
} satisfies ThemeDefinition;
```

## Overriding format defaults

Options you pass to `.format()` win over the theme's `format`:

```ts
hextimate("#6366F1", themes.shadcn).format({ as: "json" });
hextimate("#6366F1", themes.shadcn).format({ colors: "hsl-raw" });
```

## CLI

`--preset` (or `-p`) picks a built-in theme by name. Repeat it to combine a style with a framework:

```bash
hextimator '#6366F1' --preset shadcn
hextimator '#6366F1' --preset muted --preset shadcn
hextimator '#6366F1' --preset vibrant --preset mui --format object
```

The theme's format defaults apply unless you pass `--format`, `--colors`, `--separator`, or `--key-prefix`.

## React

The React components take built-in themes through the `presets` prop. See [React](react.md).

```tsx
<HextimatorProvider
  defaultColor="#6366F1"
  presets={[presets.muted, presets.shadcn]}
>
  <App />
</HextimatorProvider>
```
