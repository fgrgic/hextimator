import { adaptPalette, type CVDType, simulatePalette } from './a11y';
import { convert } from './convert';
import type { FormatResult } from './format';
import { format } from './format';
import { serializeColor } from './format/serializeColor';
import type { TokenEntry } from './format/types';
import { generate } from './generate';
import type { ColorScale, HextimatePalette } from './generate/types';
import {
	calculateContrast,
	clampHueShift,
	expandColorToScale,
	findContrastBoundaryLightness,
	resolveContrastRatio,
	wrapHue,
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
	private readonly inputColor: Color;
	private readonly options: Partial<HextimateGenerationOptions>;
	private readonly operations: Array<
		| { method: 'addRole'; args: [string, ColorInput] }
		| { method: 'addVariant'; args: [string, VariantPlacement] }
		| { method: 'addToken'; args: [string, TokenValue] }
		| { method: 'simulate'; args: [CVDType, number] }
		| { method: 'adaptFor'; args: [CVDType, number] }
	> = [];
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
		this.inputColor = color;
		this.options = options ?? {};
		this.lightPalette = generate(color, 'light', options);
		this.darkPalette = generate(color, 'dark', options);
	}

	addRole(name: string, color: ColorInput): this {
		this.operations.push({ method: 'addRole', args: [name, color] });
		const parsedColor = parse(color);

		this.lightPalette[name] = expandColorToScale(parsedColor, 'light', {
			themeLightness: this.options.themeLightness,
			minContrastRatio: this.options.minContrastRatio,
			hueShift: this.options.hueShift,
		});
		this.darkPalette[name] = expandColorToScale(parsedColor, 'dark', {
			themeLightness: this.options.themeLightness,
			minContrastRatio: this.options.minContrastRatio,
			hueShift: this.options.hueShift,
		});

		return this;
	}

	addVariant(name: string, placement: VariantPlacement): this {
		this.operations.push({ method: 'addVariant', args: [name, placement] });
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
		this.operations.push({ method: 'addToken', args: [name, value] });
		this.standaloneTokens.push({ name, value });
		return this;
	}

	simulate(type: CVDType, severity = 1): this {
		this.operations.push({ method: 'simulate', args: [type, severity] });
		this.lightPalette = simulatePalette(this.lightPalette, type, severity);
		this.darkPalette = simulatePalette(this.darkPalette, type, severity);
		return this;
	}

	adaptFor(type: CVDType, severity = 1): this {
		this.operations.push({ method: 'adaptFor', args: [type, severity] });
		this.lightPalette = adaptPalette(this.lightPalette, type, severity);
		this.darkPalette = adaptPalette(this.darkPalette, type, severity);
		return this;
	}

	fork(
		colorOrOptions?: ColorInput | Partial<HextimateGenerationOptions>,
		maybeOptions?: Partial<HextimateGenerationOptions>,
	): HextimatePaletteBuilder {
		let newColor: Color;
		let newOptions: HextimateGenerationOptions;

		if (maybeOptions !== undefined) {
			// fork(color, options)
			newColor = parse(colorOrOptions as ColorInput);
			newOptions = {
				...this.options,
				...maybeOptions,
			} as HextimateGenerationOptions;
		} else if (
			colorOrOptions !== undefined &&
			typeof colorOrOptions === 'object' &&
			!Array.isArray(colorOrOptions) &&
			!('space' in colorOrOptions)
		) {
			// fork(options) — override options only, keep same color
			newColor = this.inputColor;
			newOptions = {
				...this.options,
				...colorOrOptions,
			} as HextimateGenerationOptions;
		} else if (colorOrOptions !== undefined) {
			// fork(color) — new color, same options
			newColor = parse(colorOrOptions as ColorInput);
			newOptions = { ...this.options } as HextimateGenerationOptions;
		} else {
			// fork() — plain clone
			newColor = this.inputColor;
			newOptions = { ...this.options } as HextimateGenerationOptions;
		}

		const builder = new HextimatePaletteBuilder(newColor, newOptions);

		for (const op of this.operations) {
			switch (op.method) {
				case 'addRole':
					builder.addRole(...op.args);
					break;
				case 'addVariant':
					builder.addVariant(...op.args);
					break;
				case 'addToken':
					builder.addToken(...op.args);
					break;
				case 'simulate':
					builder.simulate(...op.args);
					break;
				case 'adaptFor':
					builder.adaptFor(...op.args);
					break;
			}
		}

		return builder;
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

		return {
			...oklch,
			l: Math.max(0, Math.min(1, oklch.l + (token.lightness ?? 0))),
			c: Math.max(0, oklch.c + (token.chroma ?? 0)),
		};
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

		const totalVariants =
			this.weakSideVariants.length + this.strongSideVariants.length;
		const rawShift = this.options.hueShift ?? 0;
		const clampedShift = clampHueShift(rawShift, totalVariants);
		const hueShiftPerStep = isStrongSide ? clampedShift : -clampedShift;
		const contrastTarget =
			resolveContrastRatio(this.options.minContrastRatio) + 0.15;

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
					const boundaryL = findContrastBoundaryLightness(
						parse(scale.DEFAULT),
						parse(scale.foreground),
						contrastTarget,
					);
					maxDelta =
						boundaryL !== null ? Math.abs(defaultOKLCH.l - boundaryL) : 0;
				} else {
					const gamutBound = sideDirection > 0 ? 1 : 0;
					maxDelta = Math.min(Math.abs(gamutBound - defaultOKLCH.l), 0.2);
				}

				this.redistributeVariants(
					scale,
					sideVariants,
					defaultOKLCH,
					maxDelta * sideDirection,
					hueShiftPerStep,
					foregroundOKLCH,
					contrastTarget,
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
		hueShiftPerStep = 0,
		foregroundOKLCH?: OKLCH,
		contrastTarget?: number,
	): void {
		if (sideVariants.length < 1) return;

		// Best approximation of pre-gamut-mapping chroma.
		const sourceChroma = Math.max(
			...Object.entries(scale)
				.filter(([k]) => k !== 'foreground')
				.map(([, v]) => convert(parse(v), 'oklch').c),
		);

		const n = sideVariants.length;

		const sorted = [...sideVariants].sort((a, b) => {
			const aL = Math.abs(convert(parse(scale[a]), 'oklch').l - defaultOKLCH.l);
			const bL = Math.abs(convert(parse(scale[b]), 'oklch').l - defaultOKLCH.l);
			return aL - bL;
		});

		for (let i = 0; i < n; i++) {
			const variantName = sorted[i];
			let newL = defaultOKLCH.l + ((i + 1) / (n + 1)) * totalDelta;
			const newH = wrapHue(defaultOKLCH.h + hueShiftPerStep * (i + 1));
			let variant: OKLCH = {
				...defaultOKLCH,
				l: Math.max(0, Math.min(1, newL)),
				c: sourceChroma,
				h: newH,
			};

			if (
				hueShiftPerStep !== 0 &&
				foregroundOKLCH &&
				contrastTarget &&
				calculateContrast(variant, foregroundOKLCH) < contrastTarget
			) {
				const direction =
					foregroundOKLCH.l < variant.l ? 1 : -1;
				let lo = direction === 1 ? variant.l : 0;
				let hi = direction === 1 ? 1 : variant.l;
				for (let j = 0; j < 20; j++) {
					const mid = (lo + hi) / 2;
					const test = { ...variant, l: mid };
					if (calculateContrast(test, foregroundOKLCH) >= contrastTarget) {
						if (direction === 1) hi = mid;
						else lo = mid;
					} else {
						if (direction === 1) lo = mid;
						else hi = mid;
					}
				}
				newL = (lo + hi) / 2;
				variant = { ...variant, l: Math.max(0, Math.min(1, newL)) };
			}

			scale[variantName] = variant;
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

		return { ...edgeColor, l: newL };
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
		// Shortest-arc hue interpolation
		const hueDiff = ((colorB.h - colorA.h + 540) % 360) - 180;
		const midH = wrapHue(colorA.h + hueDiff / 2);

		return { ...colorA, l: midL, c: midC, h: midH };
	}
}
