---
"hextimator": patch
---

Recompute `foreground-weak` when a token pins `role.DEFAULT` or `role.foreground`, so it keeps meeting `minContrastRatio` against the pinned color. A pinned `foreground-weak` keeps its value.
