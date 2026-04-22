## 0.6.0 (Latest)

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
