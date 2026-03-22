---
editUrl: false
next: false
prev: false
title: "HextimateFormatOptions"
---

Defined in: [types.ts:174](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L174)

Options that affect output formatting (serialization)

## Properties

### as?

> `optional` **as?**: `"object"` \| `"css"` \| `"tailwind"` \| `"tailwind-css"` \| `"scss"` \| `"json"`

Defined in: [types.ts:226](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L226)

Output format.
- "object" (default): { base: "#f2eee8", "base-strong": "#d4cfc8", ...}
- "css": { "--base": "#f2eee8", "--base-strong": "#d4cfc8", ...}
- "tailwind": { base: { DEFAULT: "#f2eee8", strong: "#d4cfc8", weak: "#faf8f6" } }
- "scss": { $base: "#f2eee8", $base-strong: "#d4cfc8", ...}
- "json": '{ "base": "#f2eee8", "base-strong": "#d4cfc8", ...}'
- "tailwind-css": '@theme { --color-base: #f2eee8; --color-base-strong: #d4cfc8; ... }'

***

### colors?

> `optional` **colors?**: `ColorFormat`

Defined in: [types.ts:241](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L241)

How color values are serialized in the output.

- "hex" (default) → "#f2eee8"
- "hsl"           → "hsl(30, 10%, 94%)"
- "hsl-raw"       → "30 10% 94%"            (shadcn / CSS variable style)
- "oklch"         → "oklch(0.96 0.01 70)"
- "oklch-raw"     → "0.96 0.01 70"
- "p3"            → "color(display-p3 0.94 0.93 0.91)"  (wide gamut)
- "p3-raw"        → "0.94 0.93 0.91"
- "rgb"           → "rgb(242, 238, 232)"
- "rgb-raw"       → "242 238 232"

***

### roleNames?

> `optional` **roleNames?**: `Record`\<`string`, `string`\>

Defined in: [types.ts:194](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L194)

Rename roles in the output token keys.
Internal name → your custom name.

Examples:
- base: "bg"
- accent: "button"
- positive: "success"
- negative: "error"
- warning: "warning"

If not provided, the default role names will be used.
The default role names are:
- base: "base"
- accent: "accent"
- positive: "positive"
- negative: "negative"
- warning: "warning"

***

### separator?

> `optional` **separator?**: `string`

Defined in: [types.ts:215](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L215)

Separator to use between the role and the variant in the output token keys.
If not provided, the default separator will be used.
The default separator is: "-"

Use "_" for "base_strong", "/" for "base/strong", etc.

***

### variantNames?

> `optional` **variantNames?**: `Record`\<`string`, `string`\>

Defined in: [types.ts:206](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/types.ts#L206)

Rename variant suffixes in the output token keys.
Internal name → your custom name.

Examples:
- DEFAULT: "secondary"
- strong: "primary"
- weak: "tertiary"
- foreground: "text"
