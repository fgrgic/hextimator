# Publishing to npm

Two packages get published: `packages/hextimator` (the main package) and `packages/hextimate` (a thin CLI shim that re-exports `hextimator/cli`). The repo root is a private workspace and will never be published.

Version bumps and `packages/hextimator/CHANGELOG.md` are driven by [Changesets](https://github.com/changesets/changesets). **`hextimator` and `hextimate` are fixed** (same version; `changeset version` updates both and the `hextimate` → `hextimator` dependency range). Publish **`hextimator` first**, then **`hextimate`**, since the shim depends on the main package.

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

## Release flow (Changesets + CI)

### 1. Log in to npm (once)

```bash
npm login
```

### 2. Land changes with a changeset

For anything that should appear in the next npm release, add a changeset on the same branch as the work:

```bash
# repo root
bun run changeset
```

Commit the generated `.changeset/*.md` file and merge the PR to **`main`**.

More detail: `.changeset/README.md`.

### 3. Version PR from GitHub Actions

Workflow: **`.github/workflows/release.yml`** (`release (changesets)`).

On every push to **`main`**, it runs `changesets/action`. If there are **pending** `.changeset/*.md` files on `main`, it runs `bun run version-packages` (`changeset version`), pushes a branch, and opens or updates a PR to **`main`** with:

- title **`chore: version packages`**
- label **`release`** (create that label in the repo if it does not exist yet)

It does **not** create GitHub Releases. It does **not** publish to npm.

### 4. Merge the version PR

When you are ready to cut the release, merge that PR. That applies version bumps, changelog updates, and removes the consumed changeset files on **`main`**.

### 5. Publish from your machine

After the version PR is merged, **`package.json` versions already match**. Build and publish:

```bash
cd packages/hextimator
bun run build
npm publish --dry-run   # optional but recommended
npm publish

cd ../hextimate
npm publish
```

## Quick copy-paste (after version PR is on `main`)

```bash
cd packages/hextimator
bun run build
npm publish

cd ../hextimate
npm publish
```

Do **not** use `bun pm version` for releases in this repo; versioning is owned by Changesets.

## Checklist

**Before the version PR**

- [ ] User-facing work on **`main`** has a **changeset** (`.changeset/*.md`).

**After merging the version PR**

- [ ] `cd packages/hextimator && bun run build`
- [ ] `bun test` (from `packages/hextimator` or root, as you usually run it)
- [ ] `npm publish` from `packages/hextimator`
- [ ] `npm publish` from `packages/hextimate`
