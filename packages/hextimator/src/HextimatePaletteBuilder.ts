import { convert } from './convert';
import type { FormatResult } from './format';
import { format } from './format';
import { generate } from './generate';
import type { ColorScale, HextimatePalette } from './generate/types';
import { expandColorToScale } from './generate/utils';
import { parse } from './parse';
import type {
	Color,
	ColorInput,
	HextimateFormatOptions,
	HextimateGenerationOptions,
} from './types';

export interface HextimateResult {
	light: FormatResult;
	dark: FormatResult;
}

export type VariantPlacement =
	| { beyond: string }
	| { between: [string, string] };

export class HextimatePaletteBuilder {
	private lightPalette: HextimatePalette;
	private darkPalette: HextimatePalette;
	private readonly options: HextimateGenerationOptions;

	constructor(color: Color, options?: HextimateGenerationOptions) {
		this.options = options ?? {};
		this.lightPalette = generate(color, 'light', options);
		this.darkPalette = generate(color, 'dark', options);
	}

	addRole(name: string, color: ColorInput): this {
		const parsedColor = parse(color);

		this.lightPalette[name] = expandColorToScale(parsedColor, 'light', {
			themeLightness: this.options.themeLightness,
		});
		this.darkPalette[name] = expandColorToScale(parsedColor, 'dark', {
			themeLightness: this.options.themeLightness,
		});

		return this;
	}

	addVariant(name: string, placement: VariantPlacement): this {
		for (const palette of [this.lightPalette, this.darkPalette]) {
			for (const role of Object.keys(palette)) {
				const scale = palette[role];
				const newColor = this.computeVariantColor(scale, placement);
				scale[name] = newColor;
			}
		}

		return this;
	}

	format(options?: HextimateFormatOptions): HextimateResult {
		return {
			light: format(this.lightPalette, options),
			dark: format(this.darkPalette, options),
		};
	}

	private computeVariantColor(
		scale: ColorScale,
		placement: VariantPlacement,
	): Color {
		if ('beyond' in placement) {
			return this.computeBeyondVariant(scale, placement.beyond);
		}
		return this.computeBetweenVariant(
			scale,
			placement.between[0],
			placement.between[1],
		);
	}

	private computeBeyondVariant(scale: ColorScale, edge: string): Color {
		const edgeColor = convert(parse(scale[edge]), 'oklch');
		const defaultColor = convert(parse(scale.DEFAULT), 'oklch');

		// Step = distance from DEFAULT to edge, continue in the same direction
		const delta = edgeColor.l - defaultColor.l;
		const newL = Math.max(0, Math.min(1, edgeColor.l + delta));

		return convert({ ...edgeColor, l: newL }, 'srgb');
	}

	private computeBetweenVariant(
		scale: ColorScale,
		variantA: string,
		variantB: string,
	): Color {
		const colorA = convert(parse(scale[variantA]), 'oklch');
		const colorB = convert(parse(scale[variantB]), 'oklch');

		const midL = (colorA.l + colorB.l) / 2;
		const midC = (colorA.c + colorB.c) / 2;

		return convert({ ...colorA, l: midL, c: midC }, 'srgb');
	}
}
