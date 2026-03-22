---
editUrl: false
next: false
prev: false
title: "parseColor"
---

> **parseColor**(`input`, `assumeSpace?`): `Color`

Defined in: [parse/parse.ts:37](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/parse/parse.ts#L37)

Parse a ColorInput into a Color.

If the input is already a Color, it will be returned as is.
If the input is a number, it will be parsed as a numeric hex value.
If the input is a string, it will be parsed as a hex value, CSS function, or comma separated values.
If the input is a tuple, it will be parsed as a color tuple.
If the input is a CSS function string, it will be parsed as a CSS function.
If the input is a comma separated values string, it will be parsed as a comma separated values.

**Alpha is always set to 1.** Transparent inputs like `rgba(255,0,0,0.5)` are treated as
fully opaque. This is intentional: alpha tokens break WCAG contrast guarantees because
contrast ratios depend on whatever is rendered behind the element, which hextimator cannot
know at generation time.

## Parameters

### input

`ColorInput`

ColorInput

### assumeSpace?

`"srgb"` \| `"hsl"` \| `"oklch"` \| `"oklab"` \| `"linear-rgb"` \| `"display-p3"`

color space to assume. If not provided, the color space will be inferred from the input, and default to 'srgb' if ambiguous

## Returns

`Color`

Color or throws a ColorParseError if parsing fails
