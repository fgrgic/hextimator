---
editUrl: false
next: false
prev: false
title: "HextimatePaletteBuilder"
---

Defined in: [HextimatePaletteBuilder.ts:42](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/HextimatePaletteBuilder.ts#L42)

## Constructors

### Constructor

> **new HextimatePaletteBuilder**(`color`, `options?`): `HextimatePaletteBuilder`

Defined in: [HextimatePaletteBuilder.ts:57](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/HextimatePaletteBuilder.ts#L57)

#### Parameters

##### color

`Color`

##### options?

[`HextimateGenerationOptions`](/api/interfaces/hextimategenerationoptions/)

#### Returns

`HextimatePaletteBuilder`

## Methods

### addRole()

> **addRole**(`name`, `color`): `this`

Defined in: [HextimatePaletteBuilder.ts:63](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/HextimatePaletteBuilder.ts#L63)

#### Parameters

##### name

`string`

##### color

`ColorInput`

#### Returns

`this`

***

### addToken()

> **addToken**(`name`, `value`): `this`

Defined in: [HextimatePaletteBuilder.ts:113](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/HextimatePaletteBuilder.ts#L113)

#### Parameters

##### name

`string`

##### value

[`TokenValue`](/api/type-aliases/tokenvalue/)

#### Returns

`this`

***

### addVariant()

> **addVariant**(`name`, `placement`): `this`

Defined in: [HextimatePaletteBuilder.ts:78](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/HextimatePaletteBuilder.ts#L78)

#### Parameters

##### name

`string`

##### placement

[`VariantPlacement`](/api/type-aliases/variantplacement/)

#### Returns

`this`

***

### format()

> **format**(`options?`): [`HextimateResult`](/api/interfaces/hextimateresult/)

Defined in: [HextimatePaletteBuilder.ts:118](https://github.com/fgrgic/hextimator/blob/a24c3eb1fc814042becd5eadb50bdaacbb716fdd/packages/hextimator/src/HextimatePaletteBuilder.ts#L118)

#### Parameters

##### options?

[`HextimateFormatOptions`](/api/interfaces/hextimateformatoptions/)

#### Returns

[`HextimateResult`](/api/interfaces/hextimateresult/)
