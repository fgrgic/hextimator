# Presets

Presets are partial or full themes. You can chain them together, extend them, or not use them at all. They provide a starting point. Whether it's making it easier to work with a component library like shadcn, or just a style starting point.

**`hextimate` takes only the color**; presets attach with **`.preset()`**, and optional tuning uses **`.style()`** on the same chain.

## Preset comparison

| Preset    | Kind       | What you get |
| --------- | ---------- | ------------ |
| `shadcn`  | Framework  | shadcn/ui CSS variables (`--primary`, `--muted`, charts, …). Defaults: `as: "css"`, `colors: "oklch"`. |
| `mui`     | Framework  | MUI-style palette object (`primary.main`, `background.default`, …). Defaults: `as: "object"`, `colors: "hex"`. |
| `muted`   | Style      | Desaturated accent; near-neutral foregrounds. Calm products (Notion, Linear). |
| `vibrant` | Style      | Higher chroma; complementary-tinted neutrals; slight hue shift on variants. Bold consumer apps. |
| `tinted`  | Style      | Surfaces and foregrounds carry accent hue instead of gray. Cohesive branded chrome. |
| `bold`    | Style      | Darker accents on light themes, lighter on dark; higher chroma on neutrals. Strong contrast UI. |

Combine a **style** preset with a **framework** preset when you want both (order matters for merges; see [Chaining presets](#chaining-presets)).

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

High-saturation palette with complementary tinted neutrals. Pushes chroma up, adds a slight hue shift across variants, and uses a complementary surface hue. Think Figma, Spotify.

`tinted`

Neutrals pick up the accent hue for a cohesive, branded feel. Bumps surface chroma and foreground chroma so backgrounds and text carry visible color instead of pure gray.

`bold`

Darker accent fills on light themes and lighter accent fills on dark themes, with higher chroma allowed on surfaces and slightly richer foregrounds than the defaults.

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
- **`.style()` after presets**: call `.style({ ... })` after `.preset(...)` to override overlapping style keys (for example, tighten `surfaceMaxChroma` after chaining style presets).

```typescript
// Final .style() wins over preset style for the same keys
const theme = hextimate("#6366F1")
  .preset(presets.tinted)
  .preset(presets.shadcn)
  .style({ surfaceMaxChroma: 0.01 })
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
  .format({ roleNames: { caution: "warning" } });
```

## Config objects (`HextimateConfig`)

A theme's inputs can be a plain object: accent color plus optional presets. Apps and design-tool plugins share one object and produce the same output.

```typescript
import {
  fromConfig,
  presets,
  type HextimateConfig,
  type HextimatePreset,
} from "hextimator";

const base: HextimatePreset = presets.shadcn;

function themeForTenant(tenant: {
  color: string;
  presets?: HextimatePreset[];
}) {
  const config: HextimateConfig = {
    color: tenant.color,
    presets: [base, ...(tenant.presets ?? [])],
  };
  return fromConfig(config).format({ as: "css" });
}
```

Composition is the caller's array spread - there is no `base` field or merge helper on the config. `fromConfig` returns a builder, so you can keep chaining (`.addToken(...)`, `.format(...)`, etc.).

Configs carry inline preset objects only (not string names). `JSON.stringify` / `JSON.parse` round-trips work because presets are data.

## Combining presets with the builder API

Presets compose with `addRole`, `addVariant`, `addToken`, and all other builder methods:

```typescript
const theme = hextimate("#6366F1")
  .preset(presets.muted)
  .preset(presets.shadcn)
  .addRole("cta", "#ee2244")
  .addToken("sidebar-background", { from: "surface.weak" })
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

When a preset is active, its format defaults apply unless you explicitly override them with `--format`, `--colors`, `--separator`, or `--key-prefix`.

## Custom presets

A preset is a plain object with optional `style`, `roles`, `variants`, `tokens`, and `format`.

```typescript
import { hextimate, type HextimatePreset } from "hextimator";

const myPreset: HextimatePreset = {
  style: {
    minContrastRatio: "AA",
    surfaceHueShift: 180,
  },
  roles: [
    { name: "cta", color: "#ee2244" },
    { name: "secondary", color: { from: "accent", hue: 180 } },
  ],
  variants: [
    { name: "muted", placement: { from: "weak" } },
    { name: "emphasis", placement: { from: "strong" } },
  ],
  tokens: [{ name: "border", value: { from: "surface", emphasis: 0.1 } }],
  format: {
    as: "css",
    colors: "oklch",
    roleNames: { surface: "background", accent: "primary" },
  },
};

// then use the preset
hextimate("#6366f1").preset(myPreset).format();
```

`color` on a role accepts the same `{ from: "role.variant", hue?, chroma?, lightness? }` shape as standalone tokens; `hue` is in degrees around OKLCH (for example `180` with `from: "accent"` gives a complementary secondary).

A style-only preset is just `style`:

```typescript
const pastel: HextimatePreset = {
  style: {
    light: { maxChroma: 0.1, baseLightness: 0.8 },
    dark: { maxChroma: 0.09, baseLightness: 0.7 },
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
    roleNames: { surface: "background", accent: "primary" },
    // Drop roles and variants the preset doesn't map to anything
    excludeRoles: ["caution"],
    excludeVariants: ["strong", "weak"],
  },
};
```

You can also pass them directly to `.format()` without a preset:

```typescript
hextimate("#6366F1").format({
  excludeRoles: ["caution", "positive"],
  excludeVariants: ["strong"],
});
```
