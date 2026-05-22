---
"hextimator": minor
---

Adds foreground anchored variants

You can add a new variant from foreground now. By default it will be the one that has the lowest still in rangecontrast ratio with its surface.

The generation logic can also be overwritten by providing custom `emphasis` value (e.g. `emphasis: -0.1`)

If more than one variant is 'foreground-anchored', by default it will be the same as the one it's branching from. You'll need to provide custom emphasis value to make them distinct.
