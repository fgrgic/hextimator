# Roles, variants, and tokens

These are the building blocks of a [theme](themes.md). Each example extends `baseTheme`.

## Roles: a color with its full scale

Each role gets DEFAULT, strong, weak, foreground, and foreground-weak.

```ts
const theme = {
  ...baseTheme,
  roles: {
    ...baseTheme.roles,
    cta: { color: "#EE2244" },
    secondary: { from: "accent", hue: 180 },
  },
} satisfies ThemeDefinition;

hextimate("#6A5ACD", theme).format({ as: "css" });
// Adds: --cta, --cta-strong, --cta-weak, --cta-foreground, --cta-foreground-weak,
// --surface-foreground-cta, and the same for secondary
```

A role is a built-in generator (`{ generate: "accent" }`), a fixed color (`{ color }`), or derived from another role (`{ from, hue?, chroma?, lightness? }`). `hue` rotates in OKLCH degrees, so `180` gives a complementary color.

## Variants: a step on every role

Extend the scale of every role at once.

```ts
const theme = {
  ...baseTheme,
  variants: [
    { name: "hover", placement: { from: "strong" } },
    { name: "subtle", placement: { between: ["DEFAULT", "weak"] } },
  ],
} satisfies ThemeDefinition;
// Every role now has: DEFAULT, strong, weak, foreground, foreground-weak, hover, subtle
```

- `{ from: "strong" }`: one step past strong
- `{ from: "weak" }`: one step past weak
- `{ from: "hover" }`: one step past a custom variant
- `{ between: ["DEFAULT", "weak"] }`: midpoint between two variants

Variants apply in order, so a later variant can build on an earlier one.

## Tokens: standalone values

For one-off values that do not need a full scale. A token derived from the palette follows the accent.

```ts
const theme = {
  ...baseTheme,
  tokens: [
    ...baseTheme.tokens,
    { name: "border", value: { from: "surface.weak", lightness: -0.05 } },
    { name: "ring", value: { from: "accent" } },
    { name: "placeholder", value: { from: "surface.foreground", emphasis: -0.3 } },
  ],
} satisfies ThemeDefinition;
// Adds: --border, --ring, --placeholder
```

`from` takes `role` or `role.variant`. Offsets:

- `lightness`, `chroma`, `hue`: fixed offsets in OKLCH
- `emphasis`: shifts toward more contrast (positive) or less (negative). It flips between light and dark, so one value works in both modes.

A token can also be a fixed color or per-mode values:

```ts
tokens: [
  { name: "logo", value: "#FF6600" },
  { name: "page", value: { light: "#ffffff", dark: "#1a1a1a" } },
  {
    name: "divider",
    value: {
      light: { from: "surface.weak", lightness: -0.05 },
      dark: { from: "surface.weak", lightness: 0.05 },
    },
  },
];
```

### Overriding generated colors

Use a dotted name (`role.variant`). The override lands before anything derives from it:

```ts
tokens: [{ name: "surface.strong", value: "#fafafa" }];
```

A kebab name that matches a generated label, such as `"surface-strong"`, throws. Search for `collides with a generated token`.
