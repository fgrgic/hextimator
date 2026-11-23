---
"hextimator": patch
---

Keep text readable when a token pins `role.DEFAULT` or `role.foreground`. A pinned DEFAULT now flips `foreground` to the other end when it misses `minContrastRatio`, and `foreground-weak` is recomputed against the pinned colors. Pinned `foreground` and `foreground-weak` values are kept.
