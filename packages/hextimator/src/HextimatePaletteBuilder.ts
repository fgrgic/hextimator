import { convert } from './convert';
import type { FormatResult } from './format';
import { format } from './format';
import { serializeColor } from './format/serializeColor';
import type { TokenEntry } from './format/types';
import { generate } from './generate';
import type { ColorScale, HextimatePalette } from './generate/types';
import {
	expandColorToScale,
	findContrastBoundaryLightness,
} from './generate/utils';
import { parse } from './parse';
import type {
	Color,
	ColorInput,
	HextimateFormatOptions,
	HextimateGenerationOptions,
	OKLCH,
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
	| ColorInput
	| DerivedToken
	| { light: DerivedToken | ColorInput; dark: DerivedToken | ColorInput };

export class HextimatePaletteBuilder {
	private lightPalette: HextimatePalette;
	private darkPalette: HextimatePalette;
	private readonly options: HextimateGenerationOptions;
	private readonly standaloneTokens: Array<{
		name: string;
		value: TokenValue;
	}> = [];
	private readonly weakSideVariants: string[] = ['weak'];
	private readonly strongSideVariants: string[] = ['strong'];
	private readonly betweenVariants: Array<{
		name: string;
		refs: [string, string];
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
		if ('beyond' in placement) {
			const edge = placement.beyond;

			for (const palette of [this.lightPalette, this.darkPalette]) {
				for (const role of Object.keys(palette)) {
					const scale = palette[role];
					scale[name] = this.computeBeyondVariant(scale, edge);
				}
			}

			const sideVariants = this.getSideVariantsFor(edge);
			if (sideVariants) {
				sideVariants.push(name);
				this.redistributeAllScales(sideVariants);
				this.recomputeBetweenVariants();
			}
		} else {
			this.betweenVariants.push({ name, refs: placement.between });

			for (const palette of [this.lightPalette, this.darkPalette]) {
				for (const role of Object.keys(palette)) {
					const scale = palette[role];
					scale[name] = this.computeBetweenVariant(
						scale,
						placement.between[0],
						placement.between[1],
					);
				}
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
		if (
			typeof value === 'object' &&
			value !== null &&
			!Array.isArray(value) &&
			'light' in value &&
			'dark' in value
		) {
			const themeValue = themeType === 'light' ? value.light : value.dark;
			return this.resolveTokenSingle(themeValue, palette);
		}

		return this.resolveTokenSingle(value as DerivedToken | ColorInput, palette);
	}

	private resolveTokenSingle(
		value: DerivedToken | ColorInput,
		palette: HextimatePalette,
	): Color {
		if (this.isDerivedToken(value)) {
			return this.resolveDerivedToken(value, palette);
		}
		return parse(value);
	}

	private isDerivedToken(
		value: DerivedToken | ColorInput,
	): value is DerivedToken {
		return (
			typeof value === 'object' &&
			value !== null &&
			!Array.isArray(value) &&
			'from' in value
		);
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

	private getSideVariantsFor(variantName: string): string[] | null {
		if (this.weakSideVariants.includes(variantName)) {
			return this.weakSideVariants;
		}
		if (this.strongSideVariants.includes(variantName)) {
			return this.strongSideVariants;
		}

		const sampleRole = Object.keys(this.lightPalette).find((r) => r !== 'base');
		if (!sampleRole) return null;

		const scale = this.lightPalette[sampleRole];
		if (!scale[variantName]) return null;

		const defaultOKLCH = convert(parse(scale.DEFAULT), 'oklch');
		const edgeOKLCH = convert(parse(scale[variantName]), 'oklch');
		const foregroundOKLCH = convert(parse(scale.foreground), 'oklch');

		const isTowardForeground =
			Math.sign(edgeOKLCH.l - defaultOKLCH.l) ===
			Math.sign(foregroundOKLCH.l - defaultOKLCH.l);

		return isTowardForeground ? this.strongSideVariants : this.weakSideVariants;
	}

	private redistributeAllScales(sideVariants: readonly string[]): void {
		const isStrongSide = sideVariants === this.strongSideVariants;

		for (const role of Object.keys(this.lightPalette)) {
			for (const [palette, themeType] of [
				[this.lightPalette, 'light'],
				[this.darkPalette, 'dark'],
			] as const) {
				const scale = palette[role];
				const defaultOKLCH = convert(parse(scale.DEFAULT), 'oklch');
				const foregroundOKLCH = convert(parse(scale.foreground), 'oklch');

				const contrastDirection = themeType === 'light' ? -1 : 1;
				const sideDirection = isStrongSide
					? contrastDirection
					: -contrastDirection;

				const foregroundDirection = Math.sign(
					foregroundOKLCH.l - defaultOKLCH.l,
				);
				const isTowardForeground = sideDirection === foregroundDirection;

				let maxDelta: number;
				if (isTowardForeground) {
					// Bounded by AAA contrast boundary to preserve accessibility
					const boundaryL = findContrastBoundaryLightness(
						parse(scale.DEFAULT),
						parse(scale.foreground),
						7,
					);
					maxDelta =
						boundaryL !== null ? Math.abs(defaultOKLCH.l - boundaryL) : 0.05;
				} else {
					// Contrast only improves away from foreground; cap at gamut boundary
					const gamutBound = sideDirection > 0 ? 1 : 0;
					maxDelta = Math.min(Math.abs(gamutBound - defaultOKLCH.l), 0.2);
				}

				this.redistributeVariants(
					scale,
					sideVariants,
					defaultOKLCH,
					maxDelta * sideDirection,
				);
			}
		}
	}

	/**
	 * Distributes variants evenly between DEFAULT and the lightness boundary.
	 * Uses (i+1)/(n+1) spacing so variants never sit exactly at the boundary,
	 * preserving AAA contrast margin.
	 */
	private redistributeVariants(
		scale: ColorScale,
		sideVariants: readonly string[],
		defaultOKLCH: OKLCH,
		totalDelta: number,
	): void {
		if (sideVariants.length < 1) return;

		const n = sideVariants.length;

		const sorted = [...sideVariants].sort((a, b) => {
			const aL = Math.abs(convert(parse(scale[a]), 'oklch').l - defaultOKLCH.l);
			const bL = Math.abs(convert(parse(scale[b]), 'oklch').l - defaultOKLCH.l);
			return aL - bL;
		});

		for (let i = 0; i < n; i++) {
			const variantName = sorted[i];
			const newL = defaultOKLCH.l + ((i + 1) / (n + 1)) * totalDelta;
			scale[variantName] = convert(
				{ ...defaultOKLCH, l: Math.max(0, Math.min(1, newL)) },
				'srgb',
			);
		}
	}

	private recomputeBetweenVariants(): void {
		for (const bv of this.betweenVariants) {
			for (const palette of [this.lightPalette, this.darkPalette]) {
				for (const role of Object.keys(palette)) {
					const scale = palette[role];
					scale[bv.name] = this.computeBetweenVariant(
						scale,
						bv.refs[0],
						bv.refs[1],
					);
				}
			}
		}
	}

	private computeBeyondVariant(scale: ColorScale, edge: string): Color {
		const edgeColor = convert(parse(scale[edge]), 'oklch');
		const defaultColor = convert(parse(scale.DEFAULT), 'oklch');

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
