---
"hextimator": major
"hextimate": major
---

**Breaking.** Overriding a generated token with `addToken` now uses the same address as `from:` and applies before derivation (`surface.strong` instead of `surface-strong`). Kebab keys that collide with a generated label throw (`collides with a generated token`). See migration.md.
