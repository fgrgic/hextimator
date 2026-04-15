## 0.2.0
- [#94](https://github.com/fgrgic/hextimator/pull/94): Adds scoped themes to React implementation. See [react.md](https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/react.md) for more details:
  - **`HextimatorStyle`**: renders theme CSS as a `<style>` in the tree (no `document.head` / `useEffect`); same options as the hook; optional `selector` for cascade scoping.
  - **`HextimatorScope`**: `data-hextimator-scope` wrapper: Inherits palette shape from parent via **`builder.fork(color, generation)`**; optional scope `configure` runs on top.
- [#95](https://github.com/fgrgic/hextimator/pull/95): Adds a `fallback.css` file that can be imported to have a theme before the JS loads. You could always manually do this, but this import provides an easier way to do so.


## 0.1.2
- Add more context to `llms.txt`
- Add `brand-exact` and `brand-exact-foreground` to `tailwind.css` file

## 0.1.1
- Add `./cli` export for programmatic CLI access and `npx hextimate` shim

## 0.1.0
- initial release
