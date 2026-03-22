---
editUrl: false
next: false
prev: false
title: "hextimate"
---

> **hextimate**(`color`, `options?`): [`HextimatePaletteBuilder`](/api/classes/hextimatepalettebuilder/)

Defined in: [index.ts:46](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/index.ts#L46)

Creates a palette builder from an accent/brand color.

## Parameters

### color

`ColorInput`

### options?

[`HextimateGenerationOptions`](/api/interfaces/hextimategenerationoptions/)

## Returns

[`HextimatePaletteBuilder`](/api/classes/hextimatepalettebuilder/)

## Examples

```ts
// Two-step API: generate, then format
const theme = hextimate('#ff6600')
  .format({ as: 'css', colors: 'oklch' });
```

```ts
// Extended: add roles and variants before formatting
const theme = hextimate('#ff6600', { themeLightness: 0.8 })
  .addRole('cta', '#ee2244')
  .addVariant('hover', { beyond: 'strong' })
  .format({ as: 'tailwind' });
```
