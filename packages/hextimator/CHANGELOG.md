## 0.14.1

### Patch Changes

- [#177](https://github.com/fgrgic/hextimator/pull/177) [`e035074`](https://github.com/fgrgic/hextimator/commit/e03507480239b98b4eb9aed6116487f69cf10d01) Thanks [@fgrgic](https://github.com/fgrgic)! - Wrong dist shipped with previous version, shipping correct one in this

## 0.14.0

### Minor Changes

- [#173](https://github.com/fgrgic/hextimator/pull/173) [`f1fe2ca`](https://github.com/fgrgic/hextimator/commit/f1fe2ca5a922080b7c9c20d87ea43a8279cb0782) Thanks [@fgrgic](https://github.com/fgrgic)! - Adds `foreground-weak` variant as one of the default variants.

  `foreground-weak` is the weakest contrast color to its background that still satisfies the required contrast ratio (e.g. `AAA`, or 7:1)

  Not a breaking change, additive only. If you had specific overrides for `foreground-weak`, they will continue working as expected.

## 0.13.0

### Minor Changes

- [#169](https://github.com/fgrgic/hextimator/pull/169) [`bcd6d93`](https://github.com/fgrgic/hextimator/commit/bcd6d934dc792393870e08ae3b453ecdea9a4c51) Thanks [@fgrgic](https://github.com/fgrgic)! - Overriding a generated token with `addToken` now uses a dotted key and applies before derivation (`surface.strong` instead of `surface-strong`). Kebab keys that collide with a generated label throw (`collides with a generated token`). See migration.md.

- [#170](https://github.com/fgrgic/hextimator/pull/170) [`1fd85c9`](https://github.com/fgrgic/hextimator/commit/1fd85c99ae3996aa601fec78d5b6d1c84ed59bcf) Thanks [@fgrgic](https://github.com/fgrgic)! - `HextimateConfig` and `fromConfig()` — express a theme's inputs as a plain object instead of a method chain.

  ```ts
  fromConfig({ color: "#3a86ff" });
  fromConfig({
    color: "#3a86ff",
    presets: [
      {
        tokens: [
          {
            name: "surface.weak",
            value:
              "[#123456](https://github.com/fgrgic/hextimator/issues/123456)",
          },
        ],
      },
    ],
  });
  ```

  Returns a builder, so chaining continues as usual. Presets were already serializable — the colour wasn't. Pairing them makes a whole theme a value you can store, diff, or share between programs.

### Patch Changes

- [#167](https://github.com/fgrgic/hextimator/pull/167) [`8d34573`](https://github.com/fgrgic/hextimator/commit/8d34573fb423ebeaac96c6f220bef03affc021c4) Thanks [@fgrgic](https://github.com/fgrgic)! - docs: fix wrong claim in readme

## 0.13.0

### Major Changes

- **Breaking.** Overriding a generated token with `addToken` now uses a dotted key and applies before derivation (`surface.strong` instead of `surface-strong`). Kebab keys that collide with a generated label throw (`collides with a generated token`). See [migration.md](./docs/migration.md).

## 0.12.3

### Patch Changes

- [#164](https://github.com/fgrgic/hextimator/pull/164) [`4c4974e`](https://github.com/fgrgic/hextimator/commit/4c4974edaf14f3d75ad35cd84db48890d44dc2c4) Thanks [@fgrgic](https://github.com/fgrgic)! - docs: update README gif

## 0.12.2

### Patch Changes

- [#159](https://github.com/fgrgic/hextimator/pull/159) [`6155be2`](https://github.com/fgrgic/hextimator/commit/6155be275afd33bd653bba9db9eac48ab4a83053) Thanks [@fgrgic](https://github.com/fgrgic)! - docs: refresh README and package description

## 0.12.1

### Patch Changes

- [#152](https://github.com/fgrgic/hextimator/pull/152) [`5de9e29`](https://github.com/fgrgic/hextimator/commit/5de9e2933cf57f2f323aa283c6eea15678665edc) Thanks [@fgrgic](https://github.com/fgrgic)! - trims the keywords of the package

- [#157](https://github.com/fgrgic/hextimator/pull/157) [`0fe89fa`](https://github.com/fgrgic/hextimator/commit/0fe89fa52a472f271b649360abeac6f2cbd80ffd) Thanks [@fgrgic](https://github.com/fgrgic)! - Fix `-f json` double-encoding in the CLI. With the default `--theme both`, the `light` and `dark` values were emitted as escaped JSON strings nested inside JSON, breaking `jq` pipelines. The CLI now emits a single, correctly-encoded JSON document with `light`/`dark` as real objects.

## 0.12.0

### Minor Changes

- [#150](https://github.com/fgrgic/hextimator/pull/150) [`b7800b9`](https://github.com/fgrgic/hextimator/commit/b7800b9fac32fe3ef245f60ed39c954c63e73785) Thanks [@fgrgic](https://github.com/fgrgic)! - Adds foreground anchored variants

  You can add a new variant from foreground now. By default it will be the one that has the lowest still in-range contrast ratio with its surface.

  The generation logic can also be overwritten by providing custom `emphasis` value (e.g. `emphasis: -0.1`)

  If more than one variant is 'foreground-anchored', by default it will be the same as the one it's branching from. You'll need to provide custom emphasis value to make them distinct.

## 0.11.0

### Minor Changes

- [#142](https://github.com/fgrgic/hextimator/pull/142) [`95875bf`](https://github.com/fgrgic/hextimator/commit/95875bf4889c2120626cad00cfe54c6ea8f6b9dc) Thanks [@fgrgic](https://github.com/fgrgic)! - Widens the default POSITIVE_RANGE to be [120, 180].

  The previous range was too limiting so you could get an accent color that is green, and a positive color that is a whole other green that doesn't match.

  Technically it changes the algorithm so it's a breaking change, but it's a minor change that should improve the color generation algorithm.

  If you find your themes look worse, limit your positive range to the previous [120, 160].

## 0.10.2

### Patch Changes

- [#139](https://github.com/fgrgic/hextimator/pull/139) [`6f12682`](https://github.com/fgrgic/hextimator/commit/6f12682dd2e1223a4b51b4b54d3a036dce04a41f) Thanks [@fgrgic](https://github.com/fgrgic)! - fixes 'bold' preset not being exported to the cli

## 0.10.1

### Patch Changes

- [#135](https://github.com/fgrgic/hextimator/pull/135) [`90b3920`](https://github.com/fgrgic/hextimator/commit/90b3920ba60580dfd038bd0e46d0796feffdf718) Thanks [@fgrgic](https://github.com/fgrgic)! - fix wrong priority of parameters for style. `baseLightness` should always take priority if set when calculating the lightness.

## 0.10.0

### Minor Changes

- [#127](https://github.com/fgrgic/hextimator/pull/127) [`d0bbf5a`](https://github.com/fgrgic/hextimator/commit/d0bbf5a41ba303c18228057baf9b4ba6dfb016cd) Thanks [@fgrgic](https://github.com/fgrgic)! - - **Breaking.**: Lightness of the theme is derived from the input color's lightness by default. To pin down exact lightness, provide `light.baseLightness`, and/or `dark.baseLightness`

  - Exposes `baseLightnessRange` at the top level and under `light` / `dark` to bound OKLCH **L** for accent and semantic anchors. Defaults: light `[0.4, 0.9]`, dark `[0.2, 0.8]`. CLI: `--base-lightness-range`, `--light-base-lightness-range`, `--dark-base-lightness-range`.

  - `HextimateStyleOptions` now **extends** `ThemeAdjustments` so shared knobs are declared once; `light` / `dark` use the same shape.

- [#126](https://github.com/fgrgic/hextimator/pull/126) [`57ed74a`](https://github.com/fgrgic/hextimator/commit/57ed74af8c1c8d0640d97b4a4318cd02a6fe93f7) Thanks [@fgrgic](https://github.com/fgrgic)! - **Breaking.** Renames built-in semantic role **`warning`** → **`caution`**.

Migration checklist: [migration.md](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migration.md) (section _0.9.x → 0.10.0_).

## 0.9.0 (Latest)

- Widens default semantic hue ranges (`positive` [120,160], `negative` [5,30], `warning` [45,70] OKLCH arcs). Themes using library defaults may get different semantic scales.

  Migration note: [migration.md](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migration.md) (section _0.8.x → 0.9.0_).

## 0.8.0

- Adds optional `keyPrefix` on `HextimateFormatOptions` for flat `as: "object"` and `as: "json"` output (CLI: `--key-prefix`). Use `keyPrefix: "--"` when you want CSS custom property names as object keys without using stylesheet output.

## 0.7.0

- Adds an opt-in `invertedVariants: true` format option that emits an -inverted copy of every token holding the opposite mode's value, plus a companion hextimator/tailwind-inverted.css so utilities like `bg-surface-inverted` just work.

- Renamed `ThemeAdjustments.lightness` → `baseLightness` to disambiguate it from the _relative_ `lightness` offset used by `addToken({ from, lightness })`. Same word was doing two different jobs (absolute theme anchor vs. relative offset), which made the API confusing.

  ```ts
  // Before (0.6)
  hextimate(color).style({
    light: { lightness: 0.7 },
    dark: { lightness: 0.6 },
  });

  // After (0.7)
  hextimate(color).style({
    light: { baseLightness: 0.7 },
    dark: { baseLightness: 0.6 },
  });
  ```

  The old `lightness` field still works as a deprecated alias and emits a one-time `console.warn`.

  Migration checklist: [migration.md](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migration.md).

## 0.6.0

- [#114](https://github.com/fgrgic/hextimator/pull/114) **Breaking**. Uses `surface` instead of `base` for the background tokens (e.g. `base-strong` → `surface-strong`). This avoids a class-name collision with Tailwind's built-in text-base font-size utility and makes the token name match its semantic purpose (the surface behind your content).

Migration checklist: [migration.md](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migration.md).

## 0.5.1

- [#110](https://github.com/fgrgic/hextimator/pull/110): Add ./presets as a dedicated subpath export so `import { tinted } from 'hextimator/presets'` works

## 0.5.0

- [#108](https://github.com/fgrgic/hextimator/pull/108) **Breaking.** `.format({ as: "css" })` and `.format({ as: "tailwind-css" })` now return a ready-to-paste stylesheet **string** instead of a `{ light, dark }` map of CSS variable objects. Both themes are combined into one output and wrapped for dark mode according to the new `darkMode` option.

  ```ts
  // Before (0.4)
  const { light, dark } = hextimate("#6A5ACD").format({ as: "css" });
  // light = { "--accent": "#...", ... }
  // you had to hand-build ":root {} @media {}" yourself

  // After (0.5)
  const css = hextimate("#6A5ACD").format({ as: "css" });
  // css = ":root { --accent: #...; ... }\n@media (prefers-color-scheme: dark) { :root { ... } }"
  ```

- New format options for stylesheet outputs:
  - `darkMode`: `"media"` (default) | `"class"` | `"data-attribute"` | `false`
  - `selector`: root selector for `as: "css"` (default `":root"`); ignored for `as: "tailwind-css"` (always `@theme`)
- New CLI flags mirroring the options: `--dark-mode <strategy>` and `--selector <css>`. The `--theme` flag is ignored for `css`/`tailwind-css` outputs (both themes always combine into one string).
- React integration unchanged.

  Migration checklist: [migration.md](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migration.md).

## 0.4.0

- [#106](https://github.com/fgrgic/hextimator/pull/106): add per-theme color for React
  - React provider and scope now accept per-mode brand colors (`defaultColor: string | { light, dark }`)
  - expose `onColorChange` / `onModePreferenceChange` callbacks for persistence.

## 0.3.2

- [#99](https://github.com/fgrgic/hextimator/pull/99): Adds option to chain presets. Presets are merged, last added wins if both touch the same tokens.

  - For example: `hextimate("#ff6677").preset(shadcn).preset(muted);`
  - It also works with cli: `npx hextimate "#ff6677" -p shadcn -p vibrant`

- [#100](https://github.com/fgrgic/hextimator/pull/100): Adds `excludeRoles` and `excludeVariants` to `HextimateFormatOptions`, allowing presets and `.format()` calls to suppress auto-generated roles or variants they don't need. Also available in the CLI as `--exclude-role` and `--exclude-variant` (both repeatable). Applied to the `shadcn` and `mui` built-in presets to clean up their default output.

- [#101](https://github.com/fgrgic/hextimator/pull/101): **Breaking.** Palette tuning moves to `.style(partial)` on the builder instead of extra arguments on `hextimate` or `fork`. Presets and types use `style` instead of `generation`. In React the hook and provider follow that; `HextimatorScope` takes `wrapperStyle` for the wrapper div so `style` stays palette options.

  ```ts
  hextimate(c, o) → hextimate(c).style(o)
  base.fork(c2, o) → base.fork(c2).style(o)
  base.fork(o) → base.fork().style(o)
  preset.generation → preset.style
  HextimateGenerationOptions → HextimateStyleOptions
  ```

  ```tsx
  <HextimatorProvider generation={o} /> → <HextimatorProvider style={o} />
  useHextimatorTheme().setGeneration → useHextimatorTheme().setStyle
  <HextimatorScope style={s} /> → <HextimatorScope wrapperStyle={s} />
  ```

  Migration checklist: [migration.md](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migration.md).

## 0.2.0

- [#94](https://github.com/fgrgic/hextimator/pull/94): Adds scoped themes to React implementation. See [react.md](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/react.md) for more details:
  - **`HextimatorStyle`**: renders theme CSS as a `<style>` in the tree (no `document.head` / `useEffect`); same options as the hook; optional `selector` for cascade scoping.
  - **`HextimatorScope`**: `data-hextimator-scope` wrapper: Inherits palette shape from parent via **`builder.fork(color)`** (scope `style` merges with `.style()`); optional scope `configure` runs on top.
- [#95](https://github.com/fgrgic/hextimator/pull/95): Adds a `fallback.css` file that can be imported to have a theme before the JS loads. You could always manually do this, but this import provides an easier way to do so.

## 0.1.2

- Add more context to `llms.txt`
- Add `brand-exact` and `brand-exact-foreground` to `tailwind.css` file

## 0.1.1

- Add `./cli` export for programmatic CLI access and `npx hextimate` shim

## 0.1.0

- initial release
