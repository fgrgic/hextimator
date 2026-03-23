# Real-world examples

## shadcn/ui theme

```typescript
const theme = hextimate("#6366F1")
  .addRole("muted", "#94A3B8")
  .addRole("card", "#F8FAFC")
  .addRole("popover", "#F8FAFC")
  .addToken("border", {
    light: { from: "base.weak", lightness: -0.08 },
    dark: { from: "base.weak", lightness: +0.08 },
  })
  .addToken("input", {
    light: { from: "base.weak", lightness: -0.1 },
    dark: { from: "base.weak", lightness: +0.1 },
  })
  .addToken("ring", { from: "accent" })
  .format({
    as: "css",
    colors: "oklch",
    roleNames: {
      base: "background",
      accent: "primary",
      positive: "success",
      negative: "destructive",
      warning: "warning",
      muted: "muted",
      card: "card",
      popover: "popover",
    },
    variantNames: {
      foreground: "foreground",
    },
  });

// Output keys (light & dark):
// --background, --background-foreground, --primary, --primary-foreground,
// --success, --destructive, --warning, --muted, --card, --popover,
// --border, --input, --ring, + strong/weak variants for each role
```

## Stripe-style payment UI

```typescript
const theme = hextimate("#635BFF")
  .addToken("text-secondary", { from: "base.foreground", lightness: +0.25 })
  .addToken("text-placeholder", { from: "base.foreground", lightness: +0.4 })
  .addToken("icon", { from: "base.foreground", lightness: +0.15 })
  .format({
    roleNames: {
      accent: "primary",
      base: "background",
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
      base: "column-bg",
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
