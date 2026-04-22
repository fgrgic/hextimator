# Real-world examples

## shadcn/ui theme

Use the built-in preset — see [Presets](presets.md) for details and customization options.

```typescript
import { hextimate, presets } from "hextimator";

const theme = hextimate("#6366F1")
  .preset(presets.shadcn)
  .format();
```

For older shadcn versions, add "hsl-raw" colors:

```typescript
const theme = hextimate("#6366F1")
  .preset(presets.shadcn)
  .format({ colors: "hsl-raw" });
```

## Stripe-style payment UI

```typescript
const theme = hextimate("#635BFF")
  .addToken("text-secondary", { from: "surface.foreground", lightness: +0.25 })
  .addToken("text-placeholder", { from: "surface.foreground", lightness: +0.4 })
  .addToken("icon", { from: "surface.foreground", lightness: +0.15 })
  .format({
    roleNames: {
      accent: "primary",
      surface: "background",
      positive: "success",
      negative: "danger",
      warning: "warning",
    },
    variantNames: {
      foreground: "text",
    },
  });

// Output keys (light & dark):
// primary, primary-strong, primary-weak, primary-text,
// background, background-strong, background-weak, background-text,
// success, danger, warning + variants,
// text-secondary, text-placeholder, icon
```

## Slack-style sidebar

```typescript
const theme = hextimate("#4A154B")
  .format({
    roleNames: {
      surface: "column-bg",
      accent: "active-item",
      positive: "active-presence",
      negative: "mention-badge",
    },
    variantNames: {
      DEFAULT: "DEFAULT",
      strong: "menu-bg",
      weak: "hover-item",
      foreground: "text-color",
    },
  });

// Output keys (light & dark):
// column-bg-DEFAULT, column-bg-menu-bg, column-bg-hover-item, column-bg-text-color,
// active-item-DEFAULT, active-item-menu-bg, active-item-hover-item, active-item-text-color,
// active-presence, mention-badge, warning + variants
```
