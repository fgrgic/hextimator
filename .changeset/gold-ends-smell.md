---
"hextimator": minor
---

- **Breaking.**: Lightness of the theme is derived from the input color's lightness by default. To pin down exact lightness, provide `light.baseLightness`, and/or `dark.baseLIghtness`

- Exposes `baseLightnessRange` at the top level and under `light` / `dark` to bound OKLCH **L** for accent and semantic anchors. Defaults: light `[0.4, 0.9]`, dark `[0.2, 0.8]`. CLI: `--base-lightness-range`, `--light-base-lightness-range`, `--dark-base-lightness-range`.

- `HextimateStyleOptions` now **extends** `ThemeAdjustments` so shared knobs are declared once; `light` / `dark` use the same shape.

  Migration checklist: [migration.md](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migration.md) (section _0.9.x → 0.10.0_).
