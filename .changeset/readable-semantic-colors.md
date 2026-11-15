---
"hextimator": minor
---

Make accent and semantic text and icon colors readable on surface DEFAULT, weak, and strong backgrounds. Tailwind text, SVG fill/stroke, caret, and decoration utilities now use separate ink tokens. Background and border utilities keep their existing values, and semantic fills still pair with their foregrounds.

Add `placeholderContrastRatio`, defaulting to AA (4.5:1). Set it to AAA or a numeric target to require stricter placeholder contrast. Text inks use the existing `minContrastRatio` setting.

Property-aware semantic utilities no longer support opacity modifiers such as `text-negative/50` or `bg-negative/50`. Use weak/strong variants or explicit arbitrary values. To retain the previous shared-color utilities and opacity modifiers, import `hextimator/tailwind-legacy.css` and, when needed, `hextimator/tailwind-legacy-inverted.css`. Set `propertyAware: false` to omit the new ink and placeholder tokens.
