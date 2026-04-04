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

Drop-in for [shadcn/ui](https://ui.shadcn.com) projects. Generates all the CSS variables shadcn components expect:

| shadcn variable | Source |
|---|---|
| `--background` | base color |
| `--foreground` | base foreground |
| `--primary` / `--primary-foreground` | accent color |
| `--secondary` / `--secondary-foreground` | base strong variant |
| `--muted` / `--muted-foreground` | base strong variant (dimmer foreground) |
| `--accent` / `--accent-foreground` | base strong variant (hover states) |
| `--destructive` / `--destructive-foreground` | negative color |
| `--success` / `--success-foreground` | positive color |
| `--card` / `--card-foreground` | same as background |
| `--popover` / `--popover-foreground` | same as background |
| `--border` | derived from base (lightness offset) |
| `--input` | derived from base (lightness offset) |
| `--ring` | accent color |

You also get bonus scale variants (`--primary-strong`, `--primary-weak`, `--background-strong`, etc.) that you can use beyond what shadcn requires.

**Defaults**: `as: "css"`, `colors: "oklch"` (shadcn v2). For older shadcn with HSL, override the color format:

```typescript
const theme = hextimate("#6366F1")
  .preset(presets.shadcn)
  .format({ colors: "hsl-raw" });
```

### `minimal`

Framework-agnostic preset with clean, readable CSS variable names. Good starting point when you're not using a component library.

| Variable | Source |
|---|---|
| `--background` / `--background-foreground` | base color |
| `--foreground` | base foreground (standalone) |
| `--primary` / `--primary-foreground` | accent color |
| `--success` / `--danger` / `--warning` | semantic colors |
| `--border` | derived from base |

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
hextimator '#6366F1' --preset minimal -o theme.css
```

When a preset is active, its format defaults apply unless you explicitly override them with `--format`, `--colors`, or `--separator`.

## Custom presets

A preset is a plain object — you can create your own:

```typescript
import type { HextimatePreset } from "hextimator";

const myPreset: HextimatePreset = {
  // Add extra roles (each gets DEFAULT, strong, weak, foreground)
  roles: [
    { name: "cta", color: "#ee2244" },
  ],

  // Add standalone tokens
  tokens: [
    { name: "foreground", value: { from: "base.foreground" } },
    { name: "border", value: {
      light: { from: "base", lightness: -0.08 },
      dark: { from: "base", lightness: +0.08 },
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
  roles?: Array<{ name: string; color: ColorInput }>;
  variants?: Array<{ name: string; placement: VariantPlacement }>;
  tokens?: Array<{ name: string; value: TokenValue }>;
  format?: HextimateFormatOptions;
}
```
