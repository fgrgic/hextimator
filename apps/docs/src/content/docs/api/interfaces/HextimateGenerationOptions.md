---
editUrl: false
next: false
prev: false
title: "HextimateGenerationOptions"
---

Defined in: [types.ts:92](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L92)

Options that affect color generation (the math)

## Properties

### baseColor

> **baseColor**: `ColorInput`

Defined in: [types.ts:98](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L98)

Preferred base color for dark and light mode
It will be used as a baseline to generate the rest of base colors (strong, weak)
If not provided, it will be derived from the main input color with very low chroma

***

### baseMaxChroma?

> `optional` **baseMaxChroma?**: `number`

Defined in: [types.ts:140](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L140)

Maximum chroma for the baseline colors (base, strong, weak).
Higher values will produce more colorful baseline colors, lower values will produce more gray baseline colors.

Default: 0.01.

***

### foregroundMaxChrome?

> `optional` **foregroundMaxChrome?**: `number`

Defined in: [types.ts:148](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L148)

Maximum chroma for all the foreground colors (e.g. base-accent-foreground)
Higher values will produce more colorful foreground colors, lower values will produce more gray foreground colors.

Default: 0.01.

***

### invertDarkModeBaseAccent?

> `optional` **invertDarkModeBaseAccent?**: `boolean`

Defined in: [types.ts:118](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L118)

Invert the hue used for the accent color in dark mode.
Uses base hue as accent, and accent hue as base.
Only has effect if `baseColor` is provided alongside the main accent color

Default: false.

***

### minContrastRatio?

> `optional` **minContrastRatio?**: `number` \| `"AAA"` \| `"AA"`

Defined in: [types.ts:168](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L168)

Minimum WCAG contrast ratio between non-foreground variants and the
foreground variant.

- `"AAA"` (default) → 7
- `"AA"` → 4.5
- any number → exact ratio (e.g. 3 for large text)

***

### semanticColorRanges?

> `optional` **semanticColorRanges?**: `object`

Defined in: [types.ts:128](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L128)

Degree ranges for the semantic colors.
Determines where to look for "green", "red", "yellow" in the color space.
If not provided, the default ranges will be used:
- positive: [90, 150]   greens
- negative: [345, 15]   reds
- warning: [35, 55]    ambers

#### negative?

> `optional` **negative?**: \[`number`, `number`\]

#### positive?

> `optional` **positive?**: \[`number`, `number`\]

#### warning?

> `optional` **warning?**: \[`number`, `number`\]

***

### semanticColors?

> `optional` **semanticColors?**: `object`

Defined in: [types.ts:105](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L105)

Semantic colors to use for the theme
If not provided, they will be generated from the provided main color,
and the semantic color ranges.

#### negative?

> `optional` **negative?**: `ColorInput`

#### positive?

> `optional` **positive?**: `ColorInput`

#### warning?

> `optional` **warning?**: `ColorInput`

***

### themeLightness?

> `optional` **themeLightness?**: `number`

Defined in: [types.ts:158](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L158)

Perceived lightness of the theme.
Number between 0 and 1

Default: 0.8. Higher values will produce a lighter theme, lower values will produce a darker theme.
Light theme: 0.8 + 0 = 0.8 lightness.
Dark theme: 0.8 - 0.4 = 0.4 lightness.
