# hextimator

One brand color in, full accessible theme out.

- Input: any single color. Output: complete light + dark theme with accessibility guarantees (AAA contrast by default).
- Works at runtime — built for multi-tenant apps that need per-brand themes on the fly.
- Perceptually uniform (OKLCH) — blue and yellow palettes look equally balanced, unlike HSL-based generators.

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

Full API docs, options reference, React hook, Tailwind v4 setup, and examples live in the [package README](./packages/hextimator/README.md).

## Monorepo structure

| Workspace | Path | Description |
|---|---|---|
| `hextimator` | `packages/hextimator/` | The publishable npm package |
| `playground` | `apps/playground/` | React app for local testing |
| `website` | `apps/website/` | Landing page |

## Dev workflow

```bash
bun install          # install all workspaces
```

In one terminal, watch-build the package:

```bash
cd packages/hextimator && bun run dev
```

In another, start the playground:

```bash
cd apps/playground && bun run dev
```

> The playground imports from `dist/`, so keep the package's `bun run dev` running to auto-rebuild on changes.

## Contributing

Issues and PRs are welcome at [github.com/fgrgic/hextimator](https://github.com/fgrgic/hextimator/issues).
