## 0.4.0 (Unreleased)

- [#106](https://github.com/fgrgic/hextimator/pull/106): add per-theme color for React
  - React provider and scope now accept per-mode brand colors (`defaultColor: string | { light, dark }`)
  - expose `onColorChange` / `onModePreferenceChange` callbacks for persistence.

## 0.3.2 (Latest)

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

  Migration checklist: [migrating-from-0.2.md](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/migrating-from-0.2.md).

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
