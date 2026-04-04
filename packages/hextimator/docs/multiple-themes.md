# Multiple themes

## Dynamic theming

Since hextimator works at runtime, you can change the input color at any time and regenerate the theme. This is ideal for user-selected brand colors, tenant customization, or color pickers.

```typescript
const theme = hextimate(userColor, {
  minContrastRatio: "AAA",
  baseColor: "#FFFDF4",
}).format({ as: "css" });

// Later, when the user picks a new color:
const updated = hextimate(newColor, {
  minContrastRatio: "AAA",
  baseColor: "#FFFDF4",
}).format({ as: "css" });
```

## Predefined themes with `.fork()`

When you need multiple predefined themes that share the same structure — same roles, variants, tokens, and format options — but differ in color or generation options, use `.fork()` to avoid duplicating the entire chain.

```typescript
const base = hextimate("#52FE8C", {
  minContrastRatio: "AAA",
  baseMaxChroma: 0.03,
  baseColor: "#FEBA5D",
  invertDarkModeBaseAccent: true,
  themeLightness: 0.6,
})
  .addRole("banner", "#ff006e")
  .addRole("sidebar", "bb00ff")
  .addVariant("hover", { from: "strong" })
  .addVariant("subtle", { from: "weak" })
  .addToken("brand", "#3a86ff");
```

Then extend with `.fork()`:

```ts
const warm = base.fork("#ff6677");
const cool = base.fork("#3a86ff", { invertDarkModeBaseAccent: false });
const muted = base.fork({ baseMaxChroma: 0.01, themeLightness: 0.7 });

const extended = base
  .fork("#ff6677")
  .addRole("extra", "#00cccc")
  .addToken("divider", { from: "base.weak", lightness: -0.03 });
```

`.fork()` replays all `addRole`, `addVariant`, and `addToken` calls on a fresh builder with the merged options. The original builder is not modified.

| Signature | What changes |
|---|---|
| `.fork()` | Exact clone |
| `.fork(color)` | New accent color, same options |
| `.fork(options)` | Same color, override generation options |
| `.fork(color, options)` | New color + override options |
