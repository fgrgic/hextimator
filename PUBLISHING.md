# Publishing to npm

Only `packages/hextimator` gets published — not the repo root. The root is a private workspace and will never be published.

## What gets published

The `"files"` field in `packages/hextimator/package.json` controls this. The package is ESM-only.

```
dist/
  index.js      ← main entry (ESM)
  react.js      ← hextimator/react entry (ESM)
  cli.js        ← CLI (npx hextimator / npx hextimate)
  chunk-*.js    ← shared code chunk
  *.d.ts        ← TypeScript declarations
tailwind.css    ← hextimator/tailwind.css entry
llms.txt        ← LLM-oriented API reference
LICENSE.md
README.md
```

Source files (`src/`), dev config, and tests are excluded automatically.

## Steps

### 1. Log in to npm (once)

```bash
npm login
```

### 2. Bump the version

From `packages/hextimator/`:

```bash
npm version patch   # 0.0.1 → 0.0.2
npm version minor   # 0.0.1 → 0.1.0
npm version major   # 0.0.1 → 1.0.0
```

This updates `package.json` and creates a git tag.

### 3. Build

```bash
cd packages/hextimator && bun run build
```

### 4. Dry run (optional but recommended)

```bash
npm publish --dry-run
```

This prints exactly what would be uploaded without actually publishing.

### 5. Publish

```bash
npm publish
```

## Quick copy-paste (from repo root)

```bash
cd packages/hextimator
npm version patch
bun run build
npm publish
```
