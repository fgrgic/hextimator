# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**hextimator** generates perceptually uniform color palettes from a single input color. The core goal: **consistent perceived contrast across any hue**, so a palette built from blue looks equally balanced as one from yellow. It outputs theme tokens in any format (CSS custom properties, Tailwind, SCSS, JSON, plain objects) and is designed for **runtime use** — e.g. B2B2C apps that generate per-tenant branded themes on the fly.

This is a **Bun monorepo** with three workspaces:

- `packages/hextimator` — the publishable npm package (exports `hextimate()`)
- `apps/playground` — React app for local testing of the package
- `apps/website` — React landing page

## Stack

- **Runtime/package manager**: Bun
- **Language**: TypeScript
- **Package build**: tsup (CJS + ESM + `.d.ts`)
- **Apps**: Vite + React
- **Linting/formatting**: Biome

## Commands

```bash
# From repo root
bun install                                    # install all workspaces
bun run format                                 # biome format --write .
bun run lint                                   # biome lint .
bun run check                                  # biome check --write .

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

The package source lives in `packages/hextimator/src/` with four modules:

| Module | Purpose |
|---|---|
| `parse/` | Accept any color input (hex, RGB, HSL, CSS functions, tuples, numeric) → normalized `Color` object |
| `convert/` | Color space conversions (sRGB ↔ Linear RGB ↔ OKLab ↔ OKLCH, sRGB ↔ HSL) with OKLCH gamut mapping |
| `generate/` | Build accent, base, and semantic (positive/negative/warning) color scales in OKLCH, ensuring perceptually uniform lightness |
| `format/` | Serialize palettes to CSS vars, Tailwind tokens, SCSS vars, JSON, or plain objects in any color format (hex, rgb, hsl, oklch) |

**Entry point**: `packages/hextimator/src/index.ts` exports `hextimate()`, `parseColor`, `convertColor`, and the key types.

**Key design choice**: All palette generation happens in **OKLCH** (perceptual color space). This is what ensures consistent contrast across hues. Out-of-gamut colors are mapped back to sRGB via binary-search chroma reduction that preserves lightness and hue.

The package is built by `tsup` into `dist/` (CJS + ESM). In development, the playground imports the package directly via Bun's workspace resolution (`workspace:*`), which means **the package must be built** (`bun run dev` or `bun run build`) before the playground can pick up changes.

## Publishing

```bash
cd packages/hextimator && bun run build && npm publish
```
