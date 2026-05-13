# Changesets

- After a user-facing or dependency change, run from repo root: `bun run changeset` and follow the prompts.
- The `hextimator` and `hextimate` packages are **fixed** (same version and released together). One changeset can describe the work; the `hextimate` -> `hextimator` dependency is updated when versions are cut.
- Merging to `main` with pending changesets lets CI open a **Version packages** PR. Merge that PR when you are ready, then **publish** `hextimator` and `hextimate` from your machine (or add an npm token workflow later).
