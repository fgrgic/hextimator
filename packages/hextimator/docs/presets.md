# Presets

Presets configure hextimator for a specific framework or convention in one call — adding the right tokens, renaming roles, and setting output defaults. No manual `addToken` / `roleNames` wiring needed.

```typescript
import { hextimate, presets } from "hextimator";

const theme = hextimate("#6366F1")
  .preset(presets.shadcn)
  .format();
```

## Available presets

### `shadcn`

Drop-in for [shadcn/ui](https://ui.shadcn.com). Generates `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--card`, `--popover`, `--border`, `--input`, `--ring`, `--chart-1`–`--chart-5`, plus `-foreground` counterparts. Also includes hextimator's bonus scale variants (`--primary-strong`, `--primary-weak`, etc.).

**Defaults**: `as: "css"`, `colors: "oklch"`. For older shadcn setups using HSL, override with `.format({ colors: "hsl-raw" })`.

### `mui`

Matches [MUI's](https://mui.com) theme structure. Generates `primary`, `secondary`, `error`, `warning`, `info`, `success` — each with `main`, `light`, `dark`, and `contrastText` variants. Also generates `background` (`default`, `paper`), `text` (`primary`, `secondary`, `disabled`), `divider`, and `action` tokens.

**Defaults**: `as: "object"`, `colors: "hex"`, `separator: "-"`. Use directly with `createTheme()`:

```typescript
import { createTheme } from "@mui/material/styles";

const palette = hextimate("#6366F1")
  .preset(presets.mui)
  .format();

const theme = createTheme({ palette: palette.light });
```

### `demo`

Reference preset that exercises every `HextimatePreset` capability: generation options, extra roles (`cta`, `info`), extra variants (`muted`, `vivid`), standalone tokens (`surface`, `border`, `ring`), and format defaults. Use it as a starting point when building your own presets.

**Defaults**: `as: "css"`, `colors: "hex"`.

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
const theme = hextimate("#6366F1", { light: { lightness: 0.8 } })
  .preset(presets.shadcn)
  .addRole("cta", "#ee2244")
  .addToken("sidebar-background", { from: "base.weak" })
  .format();
```

Presets are also preserved across `.fork()`:

```typescript
const builder = hextimate("#6366F1").preset(presets.shadcn);
const altTheme = builder.fork("#ff6600").format();
```

## CLI

Use `--preset` (or `-p`) from the command line:

```bash
hextimator '#6366F1' --preset shadcn
hextimator '#6366F1' --preset shadcn --colors hsl-raw
hextimator '#6366F1' --preset mui --format object
```

When a preset is active, its format defaults apply unless you explicitly override them with `--format`, `--colors`, or `--separator`.

## Custom presets

A preset is a plain object — you can create your own:

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
