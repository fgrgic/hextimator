# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**hextimator** generates perceptually uniform color palettes from a single input color. The core goal: **consistent perceived contrast across any hue**, so a palette built from blue looks equally balanced as one from yellow. It outputs theme tokens in any format (CSS custom properties, Tailwind, SCSS, JSON, plain objects) and is designed for **runtime use** — e.g. B2B2C apps that generate per-tenant branded themes on the fly.

This is a **Bun monorepo** with three workspaces:

- `packages/hextimator` — the publishable npm package (exports `hextimate()`)
- `packages/hextimator-playground` — embeddable playground component (`@hextimator/playground`)
- `apps/playground` — React app for local testing of the package
- `apps/website` — React landing page (hextimator.com)

## Stack

- **Runtime/package manager**: Bun
- **Language**: TypeScript
- **Package build**: tsup (ESM + `.d.ts`)
- **Apps**: Vite + React
- **Linting/formatting**: Biome

## Approach
- Think before acting. Read existing files before writing code.
- Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read unless the file may have changed.
- Test your code before declaring done.
- No sycophantic openers or closing fluff.
- Keep solutions simple and direct.
- User instructions always override this file.

## Output
- Return code first. Explanation after, only if non-obvious.
- No inline prose. Use comments sparingly - only where logic is unclear.
- No boilerplate unless explicitly requested.

## Code Rules
- Simplest working solution. No over-engineering.
- No abstractions for single-use operations.
- No speculative features or "you might also want..."
- Read the file before modifying it. Never edit blind.
- No docstrings or type annotations on code not being changed.
- No error handling for scenarios that cannot happen.
- Three similar lines is better than a premature abstraction.

## Review Rules
- State the bug. Show the fix. Stop.
- No suggestions beyond the scope of the review.
- No compliments on the code before or after the review.

## Debugging Rules
- Never speculate about a bug without reading the relevant code first.
- State what you found, where, and the fix. One pass.
- If cause is unclear: say so. Do not guess.

## Simple Formatting
- No em dashes, smart quotes, or decorative Unicode symbols.
- Plain hyphens and straight quotes only.
- Natural language characters (accented letters, CJK, etc.) are fine when the content requires them.
- Code output must be copy-paste safe.

## Commands

```bash
# From repo root
bun install                                    # install all workspaces
bun run format                                 # biome format --write .
bun run lint                                   # biome lint .
bun run check                                  # biome check --write .

# Dev workflow (preferred — starts package watcher + app together)
bun run dev:playground                         # watch-build hextimator + playground dev server
bun run dev:website                            # watch-build hextimator + website dev server

# Package only
cd packages/hextimator
bun run dev                                    # watch-build (tsup --watch)
bun run build                                  # one-off build → dist/
bun test                                       # run tests
bun test src/convert/gamut.test.ts             # run single-file test
```

## Architecture

The package source lives in `packages/hextimator/src/` with six modules:

| Module | Purpose |
|---|---|
| `parse/` | Accept any color input (hex, RGB, HSL, CSS functions, tuples, numeric) → normalized `Color` object |
| `convert/` | Color space conversions (sRGB ↔ Linear RGB ↔ OKLab ↔ OKLCH, sRGB ↔ HSL) with OKLCH gamut mapping |
| `generate/` | Build accent, base, and semantic (positive/negative/warning) color scales in OKLCH, ensuring perceptually uniform lightness |
| `format/` | Serialize palettes to CSS vars, Tailwind tokens, SCSS vars, JSON, or plain objects in any color format (hex, rgb, hsl, oklch) |
| `HextimatePaletteBuilder.ts` | Builder-pattern API — `hextimate()` returns a builder that supports `.addRole()`, `.addVariant()`, `.format()` chaining |
| `react.tsx` | React hook (`useHextimator`) with dark mode support (class, data-attribute, or media query strategies) |

**Entry point**: `packages/hextimator/src/index.ts` exports `hextimate()`, `HextimatePaletteBuilder`, `parseColor`, `convertColor`, and the key types. The package also has secondary entry points: `hextimator/react` (the React hook) and `hextimator/tailwind.css` (Tailwind utility layer).

**Key design choice**: All palette generation happens in **OKLCH** (perceptual color space). This is what ensures consistent contrast across hues. Out-of-gamut colors are mapped back to sRGB via binary-search chroma reduction that preserves lightness and hue.

The package is built by `tsup` into `dist/` (ESM only). In development, the playground imports the package directly via Bun's workspace resolution (`workspace:*`). Use the root `dev:playground` or `dev:website` scripts to start the package watcher and app dev server together.

## Publishing

The package publishes three entry points: `.` (core), `./react` (hook), and `./tailwind.css`.

```bash
cd packages/hextimator && bun run build && npm publish
```
