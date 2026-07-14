# hextimator

<p align="center">
    <img src="https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/assets/gh-cover.gif?raw=true" alt="hextimator" width="500">
</p>

Per-tenant themes from a single brand color: runtime theming for B2B2C and white-label apps.

Your customers pick a brand color. Your app looks good. Every time. No per-customer design reviews, no manual tuning, no edge cases where that shade of yellow breaks your UI.

Try it in the playground: **[hextimator.com](https://hextimator.com)**

## Why `hextimator` exists

You are shipping a B2B, B2B2C, or white-label app. Every tenant brings their own brand color. The options today are:

- **Let them pick any hex**. Now legal-pad yellow buttons become unreadable; cheeto tangerine toasts look identical to your warning state.
- **Curate a palette**. Now you are telling a paying customer their brand color is not allowed.

hextimator is option three. **One color in, whole theme out.** Light and dark, semantic roles and surfaces, WCAG contrast by default (AAA unless you opt down). Even for yellow. Palettes are built in OKLCH (gamut-mapped to sRGB); pure computation, SSR-friendly, with optional React and CLI.

## Documentation

Full API docs, options reference, React hook, Tailwind v4 setup, and examples live in the [package README](./packages/hextimator/README.md).

## Monorepo structure

| Workspace    | Path                   | Description                                                                                           |
| ------------ | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `hextimator` | `packages/hextimator/` | The publishable npm package                                                                           |
| `website`    | `apps/website/`        | Landing page ([hextimator.com](https://hextimator.com))                                               |
| `playground` | `apps/playground/`     | React app for testing in the browser ([playground.hextimator.com](https://playground.hextimator.com)) |

## Dev workflow

```bash
bun install          # install all workspaces
```

Run the playground and the package in watch mode:

```bash
bun run dev:playground
```

Run the website and the package in watch mode:

```bash
bun run dev:website
```

> The playground imports from `dist/`, so keep the package's `bun run dev` running to auto-rebuild on changes.

## Contributing

Issues and PRs are welcome at [github.com/fgrgic/hextimator](https://github.com/fgrgic/hextimator/issues).

## License

[MIT](./LICENSE.md).
