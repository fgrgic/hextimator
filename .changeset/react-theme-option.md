---
"hextimator": minor
---

Add a `theme` option to `useHextimator`, `HextimatorProvider`, `HextimatorScope`, and `HextimatorStyle`. It builds with `hextimate(color, theme)`, and `configure` runs after it. A scope with its own `theme` builds fresh instead of inheriting the parent. Deprecate the `style` and `presets` options in favor of `theme`. They still work.
