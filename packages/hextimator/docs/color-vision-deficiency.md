# Color vision deficiency

hextimator can simulate and adapt palettes for color vision deficiencies (CVD). Both methods chain onto the builder like any other operation.

## `.simulate()` — preview what users see

Transforms every color in the palette to show how it appears under a specific CVD type. Useful for auditing your palette's accessibility.

```typescript
const simulated = hextimate("#3a86ff")
  .simulate("deuteranopia")
  .format({ as: "css", colors: "hex" });
```

## `.adaptFor()` — optimize for a CVD type

Daltonizes the palette so colors remain distinguishable for users with a specific deficiency. Error from the simulation is redistributed into channels the user can still perceive.

```typescript
const adapted = hextimate("#3a86ff")
  .adaptFor("protanopia")
  .format({ as: "css", colors: "hex" });
```

Both methods accept an optional `severity` parameter (0–1, default `1`):

```typescript
.simulate("tritanopia", 0.5)
.adaptFor("deuteranopia", 0.7)
```

Supported CVD types: `protanopia`, `deuteranopia`, `tritanopia`, `achromatopsia`. Use `severity` to control partial deficiency.

You can also chain them with other builder methods:

```typescript
const theme = hextimate("#3a86ff", { minContrastRatio: "AAA" })
  .addRole("banner", "#ff006e")
  .addVariant("intense", { from: "strong" })
  .adaptFor("deuteranopia")
  .format({ as: "css", colors: "hex" });
```
