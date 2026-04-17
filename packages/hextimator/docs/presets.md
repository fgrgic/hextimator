# Presets

Presets are partial or full themes. You can chain them together, extend them, or not use them at all. They provide a starting point. Whether it's making it easier to work with a component library like shadcn, or just a style starting point.

**`hextimate` takes only the color**; presets attach with **`.preset()`**, and optional tuning uses **`.style()`** on the same chain.

They can be chained like so:

```typescript
import { hextimate, presets } from "hextimator";

const theme = hextimate("#6366F1")
  .preset(presets.muted)
  .preset(presets.shadcn)
  .format();
```

## Available presets

`shadcn`

Drop-in for [shadcn/ui](https://ui.shadcn.com). Generates `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--card`, `--popover`, `--border`, `--input`, `--ring`, `--chart-1`--`--chart-5`, plus `-foreground` counterparts.

**Defaults**: `as: "css"`, `colors: "oklch"`. For older shadcn setups using HSL, override with `.format({ colors: "hsl-raw" })`.

`mui`

Matches [MUI's](https://mui.com) theme structure. Generates `primary`, `secondary`, `error`, `warning`, `info`, `success` -- each with `main`, `light`, `dark`, and `contrastText` variants. Also generates `background` (`default`, `paper`), `text` (`primary`, `secondary`, `disabled`), `divider`, and `action` tokens.

**Defaults**: `as: "object"`, `colors: "hex"`, `separator: "-"`. Use directly with `createTheme()`:

```typescript
import { createTheme } from "@mui/material/styles";

const palette = hextimate("#6366F1").preset(presets.mui).format();

const theme = createTheme({ palette: palette.light });
```

`muted`

Desaturated, restrained palette. Caps accent chroma and pulls foreground colors to near-neutral. Think Notion, Linear.

`vibrant`

High-saturation palette with complementary tinted neutrals. Pushes chroma up, adds a slight hue shift across variants, and uses a complementary base hue. Think Figma, Spotify.

`tinted`

Neutrals pick up the accent hue for a cohesive, branded feel. Bumps base chroma and foreground chroma so backgrounds and text carry visible color instead of pure gray.

## Chaining presets

Call `.preset()` multiple times. Each call deep-merges with the accumulated state:

```typescript
const theme = hextimate("#6366F1")
  .preset(presets.vibrant) // sets style params
  .preset(presets.shadcn) // adds tokens, format -- doesn't add style unless the preset defines it
  .format();
```

**Merge rules:**

- **Preset `style`**: nested keys `light`, `dark`, `semanticColors`, and `semanticColorRanges` shallow-merge per key; other keys overwrite. Later presets override earlier ones for the same key.
- **Roles, variants, tokens**: concatenated (additive). A second preset never drops tokens from a previous one.
- **Format options**: deep-merged. `roleNames` and `variantNames` are merged individually.
- **`.style()` after presets**: call `.style({ ... })` after `.preset(...)` to override overlapping style keys (for example, tighten `baseMaxChroma` after chaining style presets).

```typescript
// Final .style() wins over preset style for the same keys
const theme = hextimate("#6366F1")
  .preset(presets.tinted)
  .preset(presets.shadcn)
  .style({ baseMaxChroma: 0.01 })
  .format();
```

## Overriding preset defaults

Anything you pass to `.format()` takes precedence over the preset's defaults:

```typescript
// Change output format
hextimate("#6366F1").preset(presets.shadcn).format({ as: "json" });

// Change color format
hextimate("#6366F1").preset(presets.shadcn).format({ colors: "hsl-raw" });

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
  defaultColor='#6366F1'
  presets={[presets.muted, presets.shadcn]}
  darkMode={{ type: "class" }}
>
  <App />
</HextimatorProvider>;
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
  // Style options (contrast, hue shifts, lightness, chroma)
  style: {
    minContrastRatio: "AA",
    baseHueShift: 180,
  },

  // Extra roles (each gets DEFAULT, strong, weak, foreground)
  roles: [{ name: "cta", color: "#ee2244" }],

  // Standalone tokens
  tokens: [
    { name: "foreground", value: { from: "base.foreground" } },
    {
      name: "border",
      value: {
        from: "base",
        emphasis: 0.1,
      },
    },
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

const theme = hextimate("#3a86ff").preset(myPreset).format();
```

A style-only preset is even simpler -- just style params:

```typescript
const pastel: HextimatePreset = {
  style: {
    light: { maxChroma: 0.1, lightness: 0.8 },
    dark: { maxChroma: 0.09, lightness: 0.7 },
  },
};
```

The `HextimatePreset` interface:

```typescript
interface HextimatePreset {
  style?: HextimateStyleOptions;
  roles?: Array<{ name: string; color: ColorInput | DerivedToken }>;
  variants?: Array<{ name: string; placement: VariantPlacement }>;
  tokens?: Array<{ name: string; value: TokenValue }>;
  format?: HextimateFormatOptions;
}
```

### Removing default roles and variants

Set `excludeRoles` or `excludeVariants` in a preset's `format` field to drop tokens the preset doesn't need. Both take internal names (before any `roleNames`/`variantNames` remapping).

```typescript
const myPreset: HextimatePreset = {
  format: {
    as: "css",
    colors: "oklch",
    roleNames: { base: "background", accent: "primary" },
    // Drop roles and variants the preset doesn't map to anything
    excludeRoles: ["warning"],
    excludeVariants: ["strong", "weak"],
  },
};
```

You can also pass them directly to `.format()` without a preset:

```typescript
hextimate("#6366F1").format({
  excludeRoles: ["warning", "positive"],
  excludeVariants: ["strong"],
});
```
