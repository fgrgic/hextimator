---
"hextimator": patch
---

Tint `foreground-weak` with its role color. It now blends `foreground` toward `DEFAULT`, keeping a share of the gamut chroma, so muted text on a near-grey surface carries the surface hue. It still meets `minContrastRatio` against `DEFAULT`.
