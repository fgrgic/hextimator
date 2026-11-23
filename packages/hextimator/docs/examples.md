# Real-world examples

## shadcn/ui theme

Use the built-in theme. See [Built-in themes](presets.md) for details.

```ts
import { hextimate, themes } from "hextimator";

const css = hextimate("#6366F1", themes.shadcn).format();
```

For older shadcn versions, use `hsl-raw` colors:

```ts
const css = hextimate("#6366F1", themes.shadcn).format({ colors: "hsl-raw" });
```

## Stripe-style payment UI

```ts
const theme = {
  roles: {
    background: { generate: "surface" },
    primary: { generate: "accent" },
    success: { generate: "positive" },
    danger: { generate: "negative" },
    warning: { generate: "caution" },
  },
  tokens: [
    { name: "text-secondary", value: { from: "background.foreground", lightness: 0.25 } },
    { name: "text-placeholder", value: { from: "background.foreground", lightness: 0.4 } },
    { name: "icon", value: { from: "background.foreground", lightness: 0.15 } },
  ],
  variantNames: { foreground: "text" },
} satisfies ThemeDefinition;

hextimate("#635BFF", theme).format();

// Output keys (light & dark):
// primary, primary-strong, primary-weak, primary-text,
// background, background-strong, background-weak, background-text,
// success, danger, warning + variants,
// text-secondary, text-placeholder, icon
```

## Slack-style sidebar

```ts
const theme = {
  roles: {
    "column-bg": { generate: "surface" },
    "active-item": { generate: "accent" },
    "active-presence": { generate: "positive" },
    "mention-badge": { generate: "negative" },
  },
  variantNames: {
    DEFAULT: "DEFAULT",
    strong: "menu-bg",
    weak: "hover-item",
    foreground: "text-color",
  },
} satisfies ThemeDefinition;

hextimate("#4A154B", theme).format();

// Output keys (light & dark):
// column-bg-DEFAULT, column-bg-menu-bg, column-bg-hover-item, column-bg-text-color,
// active-item-DEFAULT, active-item-menu-bg, active-item-hover-item, active-item-text-color,
// active-presence and mention-badge + variants
```
