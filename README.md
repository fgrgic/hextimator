# hextimator

<p align="center">
    <picture>
        <img src="https://github.com/fgrgic/hextimator/blob/main/packages/hextimator/docs/assets/gh-cover.webp?raw=true" alt="hextimator" width="500">
    </picture>
</p>

One color in, whole theme out.

Your customers pick a brand color. Your app looks good. Every time. No manual tuning, no edge cases where "that shade of yellow" breaks your UI.

- **Ship white-label apps without the design overhead** — generate per-tenant branded themes at runtime from a single input color. No design review per customer.
- **Every color just works** — perceptually uniform color science (OKLCH) means electric blue looks as balanced as muted olive.
- **Accessible by default** — every foreground meets AAA contrast against its background, light and dark mode included.

Try it in the playground at **[hextimator.com](https://hextimator.com)**.

## Quick start

```bash
npm install hextimator
```

```typescript
import { hextimate } from "hextimator";

const theme = hextimate("#6A5ACD").format();
// theme.light / theme.dark each contain your full theme tokens
```

## Documentation

Full API docs, options reference, React hook, Tailwind v4 setup, and examples live in the [package README](./packages/hextimator/README.md) 

## Monorepo structure

| Workspace | Path | Description |
|---|---|---|
| `hextimator` | `packages/hextimator/` | The publishable npm package |
| `playground` | `apps/playground/` | React app for local testing |
| `website` | `apps/website/` | Landing page ([hextimator.com](https://hextimator.com)) |

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
