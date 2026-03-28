# Extending the palette

## `addRole` — add a new color with its full scale

Need more than the built-in 5 roles? Add any number of seed colors. Each gets its own DEFAULT, strong, weak, and foreground variants.

```typescript
hextimate("#6A5ACD")
  .addRole("cta", "#EE2244")
  .format({ as: "css" });
// Adds: --cta, --cta-strong, --cta-weak, --cta-foreground,
```

## `addVariant` — add a lightness step to every role

Extend the scale depth across all roles at once.

```typescript
hextimate("#6A5ACD")
  .addVariant("hover", { beyond: "strong" })
  .addVariant("subtle", { between: ["DEFAULT", "weak"] })
  .format({ as: "tailwind" });
// Every role now has: DEFAULT, strong, weak, foreground, hover, subtle
```

- `{ beyond: "strong" }` — one step past strong (stronger)
- `{ beyond: "weak" }` — one step past weak (weaker)
- `{ beyond: "hover" }` — chain them: go past a custom variant
- `{ between: ["DEFAULT", "weak"] }` — midpoint between two variants

## `addToken` — add standalone derived tokens

For one-off tokens that don't need a full scale. Every token is derived from the palette, so changing the seed color updates everything.

```typescript
hextimate("#6A5ACD")
  .addToken("border", { from: "base.weak", lightness: -0.05 })
  .addToken("ring", { from: "accent" })
  .addToken("placeholder", { from: "base.foreground", lightness: +0.3 })
  .format({ as: "css" });
// Adds: --border, --ring, --placeholder
```

You can also pass a raw color value instead of deriving from the palette:

```typescript
.addToken("brand-exact", "#FF6600")
.addToken("surface", {
  light: "#ffffff",
  dark: "#1a1a1a",
})
```

When light and dark themes need different directions:

```typescript
.addToken("border", {
  light: { from: "base.weak", lightness: -0.05 },
  dark: { from: "base.weak", lightness: +0.05 },
})
```

### Overriding generated tokens

The `addToken` can be used to override any generated token from the palette as well:

```typescript
hextimate("#6A5ACD")
  .addToken("base-strong", ""#fafafa"") // overrides the generated --base-strong at formatting time
  .format({ as: "css" });
```
