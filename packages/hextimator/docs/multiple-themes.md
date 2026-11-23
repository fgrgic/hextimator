# Multiple themes

## One theme, many accents

Define the theme once and pass each tenant's accent at runtime. Every palette gets the same roles, tokens, and rules.

```ts
const theme = {
  ...baseTheme,
  style: { minContrastRatio: "AAA", surfaceColor: "#FFFDF4" },
} satisfies ThemeDefinition;

const css = hextimate(tenant.accent, theme).format({ as: "css" });

// Later, when the tenant picks a new color:
const updated = hextimate(newAccent, theme).format({ as: "css" });
```

## Variations of one theme

Spread the shared theme and change what differs:

```ts
const shared = {
  ...baseTheme,
  style: {
    minContrastRatio: "AAA",
    surfaceMaxChroma: 0.03,
    surfaceColor: "#FEBA5D",
    invertDarkModeSurfaceAccent: true,
    light: { baseLightness: 0.6 },
  },
  roles: {
    ...baseTheme.roles,
    banner: { color: "#ff006e" },
    sidebar: { color: "#bb00ff" },
  },
  variants: [
    { name: "hover", placement: { from: "strong" } },
    { name: "subtle", placement: { from: "weak" } },
  ],
} satisfies ThemeDefinition;

const cool = {
  ...shared,
  style: { ...shared.style, invertDarkModeSurfaceAccent: false },
} satisfies ThemeDefinition;

const quiet = {
  ...shared,
  style: { ...shared.style, surfaceMaxChroma: 0.01, light: { baseLightness: 0.7 } },
} satisfies ThemeDefinition;

hextimate("#ff6677", shared).format();
hextimate("#3a86ff", cool).format();
hextimate("#3a86ff", quiet).format();
```

## `.fork()`

`.fork(color?)` copies a builder, including any CVD adaptation, with an optional new accent. The original builder is not modified.

```ts
const builder = hextimate("#52FE8C", theme).adaptFor("deuteranopia");

const warm = builder.fork("#ff6677").format();
```
