# Contributing

Issues and PRs are welcome at [github.com/fgrgic/hextimator](https://github.com/fgrgic/hextimator/issues).

## Dev setup

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

## Checks

From the repo root:

```bash
bun run check                        # format + lint (Biome)
cd packages/hextimator && bun test   # package tests
```
