# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**hextimator** is a color palette creator. This is a **Bun monorepo** with three workspaces:

- `packages/hextimator` — the publishable npm package (exports `hextimate()`)
- `apps/playground` — React app for local testing of the package
- `apps/website` — React landing page

## Stack

- **Runtime/package manager**: Bun
- **Language**: TypeScript
- **Package build**: tsup (CJS + ESM + `.d.ts`)
- **Apps**: Vite + React

## Commands

```bash
# From repo root
bun install                                    # install all workspaces

# Package development
cd packages/hextimator
bun run dev                                    # watch-build (tsup --watch)
bun run build                                  # one-off build → dist/
bun test                                       # run tests

# Apps
cd apps/playground && bun run dev              # dev server (imports hextimator via workspace)
cd apps/website && bun run dev                 # landing page dev server
```

## Architecture

The package at `packages/hextimator/src/index.ts` is the only source of truth for the library. It is built by `tsup` into `dist/` (CJS + ESM) before being consumed. In development, the playground imports the package directly via Bun's workspace resolution (`workspace:*`), which means **the package must be built** (`bun run dev` or `bun run build`) before the playground can pick up changes.

## Publishing

```bash
cd packages/hextimator && bun run build && npm publish
```
