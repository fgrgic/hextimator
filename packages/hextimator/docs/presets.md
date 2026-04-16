# Presets

Presets are predefined configurations that set up hextimator in one call -- whether for a specific framework or a particular style. They can be chained:

```typescript
import { hextimate, presets } from "hextimator";

const theme = hextimate("#6366F1")
  .preset(presets.muted)
  .preset(presets.shadcn)
  .format();
```

## Available presets

### Framework presets

#### `shadcn`

Drop-in for [shadcn/ui](https://ui.shadcn.com). Generates `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--card`, `--popover`, `--border`, `--input`, `--ring`, `--chart-1`--`--chart-5`, plus `-foreground` counterparts. Also includes hextimator's bonus scale variants (`--primary-strong`, `--primary-weak`, etc.).

**Defaults**: `as: "css"`, `colors: "oklch"`. For older shadcn setups using HSL, override with `.format({ colors: "hsl-raw" })`.

#### `mui`

Matches [MUI's](https://mui.com) theme structure. Generates `primary`, `secondary`, `error`, `warning`, `info`, `success` -- each with `main`, `light`, `dark`, and `contrastText` variants. Also generates `background` (`default`, `paper`), `text` (`primary`, `secondary`, `disabled`), `divider`, and `action` tokens.

**Defaults**: `as: "object"`, `colors: "hex"`, `separator: "-"`. Use directly with `createTheme()`:

```typescript
import { createTheme } from "@mui/material/styles";

const palette = hextimate("#6366F1")
  .preset(presets.mui)
  .format();

const theme = createTheme({ palette: palette.light });
```

### Style presets

Style presets only set generation parameters -- they have no opinion on tokens, naming, or output format. This makes them composable with any framework preset.

#### `muted`

Desaturated, restrained palette. Caps accent chroma and pulls foreground colors to near-neutral. Think Notion, Linear.

#### `vibrant`

High-saturation palette with complementary tinted neutrals. Pushes chroma up, adds a slight hue shift across variants, and uses a complementary base hue. Think Figma, Spotify.

#### `tinted`

Neutrals pick up the accent hue for a cohesive, branded feel. Bumps base chroma and foreground chroma so backgrounds and text carry visible color instead of pure gray.

## Chaining presets

Call `.preset()` multiple times. Each call deep-merges with the accumulated state:

```typescript
const theme = hextimate("#6366F1")
  .preset(presets.vibrant)   // sets generation params
  .preset(presets.shadcn)    // adds tokens, format -- doesn't touch generation
  .format();
```

**Merge rules:**

- **Generation options**: deep-merged. Later presets override earlier ones for the same key.
- **Roles, variants, tokens**: concatenated (additive). A second preset never drops tokens from a previous one.
- **Format options**: deep-merged. `roleNames` and `variantNames` are merged individually.
- **Constructor options always win**: anything passed to `hextimate(color, options)` takes precedence over all presets.

```typescript
// Constructor's baseMaxChroma (0.01) wins over both presets
const theme = hextimate("#6366F1", { baseMaxChroma: 0.01 })
  .preset(presets.tinted)    // would set baseMaxChroma: 0.05
  .preset(presets.shadcn)
  .format();
```

## Overriding preset defaults

Anything you pass to `.format()` takes precedence over the preset's defaults:

```typescript
// Change output format
hextimate("#6366F1")
  .preset(presets.shadcn)
  .format({ as: "json" });

// Change color format
hextimate("#6366F1")
  .preset(presets.shadcn)
  .format({ colors: "hsl-raw" });

// Add extra role renames (merged with preset's)
hextimate("#6366F1")
  .preset(presets.shadcn)
  .format({ roleNames: { warning: "caution" } });
```

## Combining presets with the builder API

Presets compose with `addRole`, `addVariant`, `addToken`, and all other builder methods:

```typescript
const theme = hextimate("#6366F1")
  .preset(presets.muted)
  .preset(presets.shadcn)
  .addRole("cta", "#ee2244")
  .addToken("sidebar-background", { from: "base.weak" })
  .format();
```

Presets are also preserved across `.fork()`:

```typescript
const builder = hextimate("#6366F1")
  .preset(presets.vibrant)
  .preset(presets.shadcn);

const altTheme = builder.fork("#ff6600").format();
```

## React

The `HextimatorProvider`, `HextimatorScope`, and `useHextimator` hook all accept a `presets` prop:

```tsx
import { HextimatorProvider } from "hextimator/react";
import { presets } from "hextimator";

<HextimatorProvider
  defaultColor="#6366F1"
  presets={[presets.muted, presets.shadcn]}
  darkMode={{ type: "class" }}
>
  <App />
</HextimatorProvider>
```

Presets can be updated at runtime via `useHextimatorTheme()`:

```tsx
const { setPresets } = useHextimatorTheme();

// Switch to vibrant style
setPresets([presets.vibrant, presets.shadcn]);
```

## CLI

Use `--preset` (or `-p`) from the command line. Pass it multiple times to chain:

```bash
hextimator '#6366F1' --preset shadcn
hextimator '#6366F1' --preset muted --preset shadcn
hextimator '#6366F1' --preset vibrant --preset mui --format object
hextimator '#6366F1' --preset shadcn --colors hsl-raw
```

When a preset is active, its format defaults apply unless you explicitly override them with `--format`, `--colors`, or `--separator`.

## Custom presets

A preset is a plain object -- you can create your own:

```typescript
import type { HextimatePreset } from "hextimator";

const myPreset: HextimatePreset = {
  // Generation options (contrast, hue shifts, lightness, chroma)
  generation: {
    minContrastRatio: "AA",
    baseHueShift: 180,
  },

  // Extra roles (each gets DEFAULT, strong, weak, foreground)
  roles: [
    { name: "cta", color: "#ee2244" },
  ],

  // Standalone tokens
  tokens: [
    { name: "foreground", value: { from: "base.foreground" } },
    { name: "border", value: {
      from: "base", emphasis: 0.1,
    }},
  ],

  // Default format options
  format: {
    as: "css",
    colors: "oklch",
    roleNames: {
      base: "background",
      accent: "primary",
    },
  },
};

const theme = hextimate("#3a86ff")
  .preset(myPreset)
  .format();
```

A style-only preset is even simpler -- just generation params:

```typescript
const pastel: HextimatePreset = {
  generation: {
    light: { maxChroma: 0.1, lightness: 0.8 },
    dark: { maxChroma: 0.09, lightness: 0.7 },
  },
};
```

The `HextimatePreset` interface:

```typescript
interface HextimatePreset {
  generation?: HextimateGenerationOptions;
  roles?: Array<{ name: string; color: ColorInput | DerivedToken }>;
  variants?: Array<{ name: string; placement: VariantPlacement }>;
  tokens?: Array<{ name: string; value: TokenValue }>;
  format?: HextimateFormatOptions;
}
```
