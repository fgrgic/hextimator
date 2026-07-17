---
"hextimator": minor
---

Overriding a generated token with `addToken` now uses a dotted key and applies before derivation (`surface.strong` instead of `surface-strong`). Kebab keys that collide with a generated label throw (`collides with a generated token`). See migration.md.
