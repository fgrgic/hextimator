import { convert } from './convert';
import type { FormatResult } from './format';
import { format } from './format';
import { serializeColor } from './format/serializeColor';
import type { TokenEntry } from './format/types';
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

export interface DerivedToken {
	from: string;
	lightness?: number;
	chroma?: number;
}

export type TokenValue =
	| DerivedToken
	| { light: DerivedToken; dark: DerivedToken };

export class HextimatePaletteBuilder {
	private lightPalette: HextimatePalette;
	private darkPalette: HextimatePalette;
	private readonly options: HextimateGenerationOptions;
	private readonly standaloneTokens: Array<{
		name: string;
		value: TokenValue;
	}> = [];

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

	addToken(name: string, value: TokenValue): this {
		this.standaloneTokens.push({ name, value });
		return this;
	}

	format(options?: HextimateFormatOptions): HextimateResult {
		const colorFormat = options?.colors ?? 'hex';

		const lightTokens = this.resolveStandaloneTokens(
			'light',
			this.lightPalette,
			colorFormat,
		);
		const darkTokens = this.resolveStandaloneTokens(
			'dark',
			this.darkPalette,
			colorFormat,
		);

		return {
			light: format(this.lightPalette, options, lightTokens),
			dark: format(this.darkPalette, options, darkTokens),
		};
	}

	private resolveStandaloneTokens(
		themeType: 'light' | 'dark',
		palette: HextimatePalette,
		colorFormat: HextimateFormatOptions['colors'],
	): TokenEntry[] {
		return this.standaloneTokens.map(({ name, value }) => {
			const color = this.resolveTokenValue(value, themeType, palette);
			return {
				role: name,
				variant: 'DEFAULT',
				isDefault: true,
				value: serializeColor(color, colorFormat ?? 'hex'),
			};
		});
	}

	private resolveTokenValue(
		value: TokenValue,
		themeType: 'light' | 'dark',
		palette: HextimatePalette,
	): Color {
		// Per-theme override: { light: ..., dark: ... }
		if ('light' in value && 'dark' in value) {
			const themeValue = themeType === 'light' ? value.light : value.dark;
			return this.resolveDerivedToken(themeValue, palette);
		}

		// Derived token: { from: 'base.foreground', lightness: +0.3 }
		return this.resolveDerivedToken(value as DerivedToken, palette);
	}

	private resolveDerivedToken(
		token: DerivedToken,
		palette: HextimatePalette,
	): Color {
		const [role, variant = 'DEFAULT'] = token.from.split('.');
		const scale = palette[role];
		if (!scale) {
			throw new Error(
				`Unknown role "${role}" in token reference "${token.from}"`,
			);
		}

		const sourceColor = scale[variant];
		if (!sourceColor) {
			throw new Error(
				`Unknown variant "${variant}" in token reference "${token.from}"`,
			);
		}

		const oklch = convert(parse(sourceColor), 'oklch');

		const adjusted = {
			...oklch,
			l: Math.max(0, Math.min(1, oklch.l + (token.lightness ?? 0))),
			c: Math.max(0, oklch.c + (token.chroma ?? 0)),
		};

		return convert(adjusted, 'srgb');
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
