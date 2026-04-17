# Migrating from 0.2.x to 0.3.0

0.3.0 introduces breaking API changes. This page is a checklist; see the [CHANGELOG](../CHANGELOG.md) for release notes and PR links.

## Core builder

| Before (0.2) | After (0.3) |
|---|---|
| `hextimate(color, options)` | `hextimate(color).style(options)` (or split into several `.style()` calls) |
| `base.fork(otherColor, options)` | `base.fork(otherColor).style(options)` |
| `base.fork(options)` (same color) | `base.fork().style(options)` |
| Preset field `generation` | Preset field `style` |
| Type `HextimateGenerationOptions` | `HextimateStyleOptions` |
| `themeLightness` (and similar) on a flat options object | Use `light` / `dark` on `ThemeAdjustments` inside `.style()` — see [Customization](customization.md) |

Search your codebase for `hextimate(`, `.fork(`, `generation:`, and `HextimateGenerationOptions`.

## React

| Before (0.2) | After (0.3) |
|---|---|
| `generation` / `setGeneration` on provider, hook, or `useHextimator` options | `style` / `setStyle` |
| `HextimatorScope` prop `style` for inline styles on the wrapper | `wrapperStyle` (the name `style` is reserved for palette options) |

`useHextimator(color, { darkMode, format, … })` is unchanged in shape: only the **`generation`** key became **`style`**.

## Further reading

- [Multiple themes](multiple-themes.md) — `.fork()` + `.style()`
- [Presets](presets.md) — preset `style`, chaining, `.style()` after `.preset()`
- [React](react.md) — provider, hook, scope props
