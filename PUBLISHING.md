# Publishing to npm

Two packages get published: `packages/hextimator` (the main package) and `packages/hextimate` (a thin CLI shim that re-exports `hextimator/cli`). The repo root is a private workspace and will never be published.

Publish hextimator first since hextimate depends on it.

## What gets published

### hextimator

The `"files"` field in `packages/hextimator/package.json` controls this. The package is ESM-only.

```
dist/
  index.js      <- main entry (ESM)
  react.js      <- hextimator/react entry (ESM)
  cli.js        <- CLI (npx hextimator / npx hextimate)
  chunk-*.js    <- shared code chunk
  *.d.ts        <- TypeScript declarations
tailwind.css    <- hextimator/tailwind.css entry
llms.txt        <- LLM-oriented API reference
LICENSE.md
README.md
```

Source files (`src/`), dev config, and tests are excluded automatically.

### hextimate

```
cli.js          <- re-exports hextimator/cli
```

No build step. Just a shim so `npx hextimate` works.

## Steps

### 1. Log in to npm (once)

```bash
npm login
```

### 2. Publish hextimator

From `packages/hextimator/`:

```bash
npm version patch   # 0.0.1 -> 0.0.2
npm version minor   # 0.0.1 -> 0.1.0
npm version major   # 0.0.1 -> 1.0.0
```

This updates `package.json` and creates a git tag.

```bash
bun run build
npm publish --dry-run   # optional but recommended
npm publish
```

### 3. Publish hextimate

From `packages/hextimate/`:

```bash
# Update the hextimator dependency to match the version you just published
# Then bump hextimate's own version to match
npm version patch
npm publish
```

Keep hextimate's version in sync with hextimator for simplicity.

## Quick copy-paste (from repo root)

```bash
cd packages/hextimator
npm version patch
bun run build
npm publish

cd ../hextimate
npm version patch
npm publish
```

### Checklist

**hextimator**
- [ ] Bump version in `packages/hextimator/package.json`
- [ ] `cd packages/hextimator && bun run build` - rebuild dist
- [ ] `bun test` - make sure nothing broke
- [ ] `npm publish` from `packages/hextimator`

**hextimate**
- [ ] Update `hextimator` dependency version in `packages/hextimate/package.json`
- [ ] Bump version in `packages/hextimate/package.json`
- [ ] `npm publish` from `packages/hextimate`
