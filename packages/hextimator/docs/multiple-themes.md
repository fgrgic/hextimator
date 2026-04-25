# Multiple themes

## Dynamic theming

Since hextimator works at runtime, you can change the input color at any time and regenerate the theme. This is ideal for user-selected brand colors, tenant customization, or color pickers.

```typescript
const theme = hextimate(userColor)
  .style({
    minContrastRatio: "AAA",
    surfaceColor: "#FFFDF4",
  })
  .format({ as: "css" });

// Later, when the user picks a new color:
const updated = hextimate(newColor)
  .style({
    minContrastRatio: "AAA",
    surfaceColor: "#FFFDF4",
  })
  .format({ as: "css" });
```

## Predefined themes with `.fork()`

When you need multiple predefined themes that share the same structure — same roles, variants, tokens, and format options — but differ in color or style options, use `.fork()` to avoid duplicating the entire chain. Change style on a fork with `.style()`.

```typescript
const builder = hextimate("#52FE8C")
  .style({
    minContrastRatio: "AAA",
    surfaceMaxChroma: 0.03,
    surfaceColor: "#FEBA5D",
    invertDarkModeSurfaceAccent: true,
    light: { baseLightness: 0.6 },
  })
  .addRole("banner", "#ff006e")
  .addRole("sidebar", "bb00ff")
  .addVariant("hover", { from: "strong" })
  .addVariant("subtle", { from: "weak" })
  .addToken("brand", "#3a86ff");
```

Then extend with `.fork()`:

```ts
const warm = builder.fork("#ff6677");
const cool = builder.fork("#3a86ff").style({ invertDarkModeSurfaceAccent: false });
const muted = builder.fork().style({ surfaceMaxChroma: 0.01, light: { baseLightness: 0.7 } });

const extended = builder
  .fork("#ff6677")
  .addRole("extra", "#00cccc")
  .addToken("divider", { from: "surface.weak", lightness: -0.03 });
```

`.fork()` replays all recorded builder operations on a fresh builder. The original builder is not modified.

| Signature | What changes |
|---|---|
| `.fork()` | Exact clone (same color and style) |
| `.fork(color)` | New accent color, same style |
| `.fork().style(partial)` or `.fork(color).style(partial)` | Clone, then merge additional style options |
