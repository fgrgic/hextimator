# Themes

A theme describes the structure of a palette. The accent stays a separate input, so one theme serves every tenant.

```ts
import { hextimate } from "hextimator";

hextimate(accent).format(); // hextimator's default theme
hextimate(accent, theme).format(); // a theme you defined or loaded
```

A `ThemeDefinition` is plain data. It survives a JSON round trip, so you can store it in a database, ship it from a CMS, or share it between your app and design tools.

## Fields

| Field          | What it does                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------- |
| `style`        | Generation settings: contrast, chroma, lightness, hue shifts. See [Customization](customization.md). |
| `roles`        | Roles to generate. The key sets the output name.                                                   |
| `variants`     | Extra variants added to every role.                                                                |
| `tokens`       | Standalone tokens.                                                                                 |
| `variantNames` | Renames variant suffixes in the output, such as `{ DEFAULT: "main", foreground: "contrastText" }`. |
| `format`       | Default output options, such as `{ as: "css", colors: "oklch" }`. `.format()` options override them. |

Every field is optional. A theme without `roles` produces no roles.

## Roles

A role value is one of three shapes:

```ts
const theme = {
  roles: {
    // A built-in generator: surface, accent, positive, negative, or caution
    surface: { generate: "surface" },
    brand: { generate: "accent" },
    danger: { generate: "negative" },

    // A fixed color
    cta: { color: "#ee2244" },

    // A role derived from another role
    secondary: { from: "brand", hue: 180 },
  },
} satisfies ThemeDefinition;
```

Every role gets `DEFAULT`, `strong`, `weak`, `foreground`, and `foreground-weak`, plus any theme `variants`.

The surface role also gets colored text for every other declared role. With the roles above you get `surface-foreground-brand`, `surface-foreground-danger`, `surface-foreground-cta`, and `surface-foreground-secondary`. Each one meets `minContrastRatio` on the surface's DEFAULT, weak, and strong variants.

Any generator except `surface` can appear more than once. Each copy is its own role. A second `surface` role throws.

## Variants and tokens

```ts
const theme = {
  ...baseTheme,
  variants: [{ name: "hover", placement: { from: "strong" } }],
  tokens: [
    ...baseTheme.tokens,
    { name: "ring", value: { from: "accent" } },
    { name: "border", value: { from: "surface", emphasis: 0.1 } },
    { name: "surface.strong", value: "#fafafa" },
  ],
} satisfies ThemeDefinition;
```

A token value is a color, a reference to a palette value, per-mode values, or a built-in generator (`brand-exact`, `brand-exact-foreground`). A dotted name such as `surface.strong` overrides a generated color. See [Roles, variants, and tokens](extending-the-palette.md) for placements and offsets.

## Order

hextimator applies a theme in a fixed order:

1. Generated roles
2. Fixed-color and derived roles
3. Variants
4. Tokens

A derived role can reference only the built-in variants (`DEFAULT`, `strong`, `weak`, `foreground`, `foreground-weak`). Tokens can reference any variant, including your own.

## Extend a theme

Spread an existing theme and override fields. The last value of each field wins. Arrays and role maps replace the whole field, so spread the base values to keep them.

```ts
import { baseTheme, hextimate, type ThemeDefinition } from "hextimator";

const { positive, negative, caution, ...brandRoles } = baseTheme.roles;

const customTheme = {
  ...baseTheme,
  style: {
    minContrastRatio: "AA",
    surfaceHueShift: 160,
    surfaceMaxChroma: 0.025,
  },
  roles: {
    ...brandRoles,
    success: positive,
    danger: negative,
    warning: caution,
    cta: { color: "#ee2244" },
  },
  variants: [{ name: "hover", placement: { from: "strong" } }],
  tokens: [
    ...baseTheme.tokens,
    { name: "button-bg", value: { from: "accent" } },
    { name: "button-hover", value: { from: "accent.hover" } },
    { name: "button-text", value: { from: "accent.foreground" } },
  ],
} satisfies ThemeDefinition;

hextimate(accent, customTheme).format();
```

Built-in themes extend the same way:

```ts
import { themes } from "hextimator";

const calmShadcn = {
  ...themes.shadcn,
  style: themes.muted.style,
} satisfies ThemeDefinition;
```

## Build a theme from scratch

Skip `baseTheme` to get only what you declare:

```ts
const minimalTheme = {
  roles: {
    page: { generate: "surface" },
    brand: { generate: "accent" },
    danger: { generate: "negative" },
  },
  tokens: [{ name: "border", value: { from: "page", emphasis: 0.1 } }],
  format: { as: "css", colors: "oklch" },
} satisfies ThemeDefinition;

hextimate(accent, minimalTheme).format();
```

```css
:root {
  --page: oklch(0.97 0.01 277.1);
  --page-foreground-brand: oklch(0.438 0.204 277.1);
  --brand: oklch(0.7399 0.2041 277.1);
  --danger: oklch(0.7555 0.2041 5);
  --border: oklch(0.87 0.01 277.1);
  /* ... */
}
```

Using Tailwind with your own names? Generate aliases at build time. See [Tailwind](tailwind.md#custom-themes).
