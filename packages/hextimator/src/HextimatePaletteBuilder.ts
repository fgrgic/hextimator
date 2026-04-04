import { adaptPalette, type CVDType, simulatePalette } from './a11y';
import { convert } from './convert';
import type { FlatTokenMap, FormatResult, NestedTokenMap } from './format';
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
import type { HextimatePreset } from './presets/types';
import type {
	Color,
	ColorInput,
	HextimateFormatOptions,
	HextimateGenerationOptions,
	OKLCH,
} from './types';

/** The result of formatting a palette, containing both light and dark theme tokens. */
export interface HextimateResult<F = FormatResult> {
	light: F;
	dark: F;
}

/**
 * Where to place a new variant relative to existing ones.
 * - `{ beyond: "strong" }` — one step past the named variant
 * - `{ between: ["DEFAULT", "weak"] }` — midpoint between two variants
 */
export type VariantPlacement =
	| { beyond: string }
	| { between: [string, string] };

/**
 * A token derived from an existing role+variant, with optional lightness/chroma offsets.
 *
 * @example
 * { from: "base.weak", lightness: -0.05 }
 */
export interface DerivedToken {
	from: string;
	lightness?: number;
	chroma?: number;
}

/**
 * Value for a standalone token: a raw color, a derived reference, or per-theme values.
 *
 * @example
 * "#FF6600"
 * { from: "accent", lightness: +0.1 }
 * { light: { from: "base.weak", lightness: -0.05 }, dark: { from: "base.weak", lightness: +0.05 } }
 */
export type TokenValue =
	| ColorInput
	| DerivedToken
	| { light: DerivedToken | ColorInput; dark: DerivedToken | ColorInput };

/**
 * Palette builder.
 *
 * Supports adding roles, variants, and standalone tokens, as well as simulating and adapting for CVD.
 * All operations are recorded and replayed in order on fork, ensuring consistent results.
 * The internal palette is stored in a raw form with OKLCH color objects, allowing for precise adjustments and transformations.
 */
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
		| { method: 'preset'; args: [HextimatePreset] }
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
	private presetFormatDefaults?: HextimateFormatOptions;

	constructor(color: Color, options?: HextimateGenerationOptions) {
		this.inputColor = color;
		this.options = options ?? {};
		this.lightPalette = generate(color, 'light', options);
		this.darkPalette = generate(color, 'dark', options);
		this.applyToken('brand-exact', color);
	}

	/**
	 * Adds a custom role with given name and color.
	 * The color is expanded into a full scale and added to both light and dark palettes.
	 *
	 * e.g. `addRole('cta', '#ff0066')` adds a "cta" role with the specified hue as the base,
	 * generating appropriate variants (`cta-strong`, `cta-weak`, `cta-foreground`) for light and dark themes.
	 *
	 * @param name Role name (e.g. "cta", "banner")
	 * @param color Base color for the role, its hue will be expanded into a full scale (e.g. "#ff0066")
	 */
	addRole(name: string, color: ColorInput): this {
		this.operations.push({ method: 'addRole', args: [name, color] });
		this.applyRole(name, color);
		return this;
	}

	/**
	 *
	 * Adds a variant to all roles, either "beyond" an existing variant or "between" two existing variants.
	 *
	 * e.g. `addVariant('placeholder', { beyond: 'weak' })` adds a "placeholder" variant that is "weaker" than "weak" across all roles and themes.
	 * `addVariant('highlight', { between: ['DEFAULT', 'strong'] })` adds a "highlight" variant that is exactly between "DEFAULT" and "strong" across all roles and themes.
	 *
	 * @param name Variant name (e.g. "placeholder", "highlight")
	 * @param placement Placement of the variant, either `{ beyond: 'weak' }` or `{ between: ['DEFAULT', 'strong'] }`
	 */
	addVariant(name: string, placement: VariantPlacement): this {
		this.operations.push({ method: 'addVariant', args: [name, placement] });
		this.applyVariant(name, placement);
		return this;
	}

	/**
	 * Adds a standalone/one-off token that doesn't fit the role+variant structure.
	 * The value can be a direct color, a derived token based on an existing role+variant, or an object specifying different values for light and dark themes.
	 *
	 * e.g. `addToken('brand', '#3a86ff')` adds a "brand" token with the specified color in both themes.
	 * `addToken('brand', { light: '#3a86ff', dark: '#ff0066' })` adds a "brand" token with different colors in light and dark themes.
	 *
	 * It can also be used to override specific tokens after generation.
	 * `addToken('base-strong', '#ff0066')` overrides the automatically generated "base-strong" variant with a custom color.
	 *
	 * @param name Token name (e.g. "brand", "logo")
	 * @param value Token value, which can be an exact color, or derived from an existing role+variant.
	 */
	addToken(name: string, value: TokenValue): this {
		this.operations.push({ method: 'addToken', args: [name, value] });
		this.applyToken(name, value);
		return this;
	}

	/**
	 * Applies a preset that configures roles, tokens, and format defaults
	 * for a specific framework or convention (e.g. shadcn/ui).
	 *
	 * Preset format defaults are used as a base in `.format()` — any options
	 * you pass to `.format()` will override the preset's defaults.
	 *
	 * @example
	 * import { hextimate, presets } from 'hextimator';
	 *
	 * const theme = hextimate('#6366F1')
	 *   .preset(presets.shadcn)
	 *   .format();
	 *
	 * // Override preset's color format:
	 * const theme = hextimate('#6366F1')
	 *   .preset(presets.shadcn)
	 *   .format({ colors: 'hsl-raw' });
	 */
	preset(preset: HextimatePreset): this {
		this.operations.push({ method: 'preset', args: [preset] });

		if (preset.generation) {
			const userOptions = { ...this.options };
			Object.assign(this.options, preset.generation, userOptions);
			this.lightPalette = generate(
				this.inputColor,
				'light',
				this.resolvedOptions(),
			);
			this.darkPalette = generate(
				this.inputColor,
				'dark',
				this.resolvedOptions(),
			);
		}

		for (const role of preset.roles ?? []) {
			this.applyRole(role.name, role.color);
		}
		for (const variant of preset.variants ?? []) {
			this.applyVariant(variant.name, variant.placement);
		}
		for (const token of preset.tokens ?? []) {
			this.applyToken(token.name, token.value);
		}

		if (preset.format) {
			this.presetFormatDefaults = {
				...this.presetFormatDefaults,
				...preset.format,
				roleNames: {
					...this.presetFormatDefaults?.roleNames,
					...preset.format.roleNames,
				},
				variantNames: {
					...this.presetFormatDefaults?.variantNames,
					...preset.format.variantNames,
				},
			};
		}

		return this;
	}

	/**
	 *
	 * Simulates how the palette would look for a given type and severity of CVD.
	 * This is a destructive operation that permanently alters the palette, but can be useful for testing and previewing.
	 *
	 * It should not be used to generate the final output for users with CVD. For that, use `adaptFor` instead.
	 *
	 * e.g. `simulate('deuteranopia', 0.5)` simulates moderate deuteranopia, allowing you to see how the colors would appear to users with that condition.
	 * @param type Type of CVD to simulate (e.g. "protanopia", "deuteranopia", "tritanopia")
	 * @param severity Severity of the CVD simulation, from 0 (no effect) to 1 (full simulation). Defaults to 1 for a complete simulation.
	 */
	simulate(type: CVDType, severity = 1): this {
		this.operations.push({ method: 'simulate', args: [type, severity] });
		this.lightPalette = simulatePalette(this.lightPalette, type, severity);
		this.darkPalette = simulatePalette(this.darkPalette, type, severity);
		return this;
	}

	/**
	 * Adapts the palette for a given type and severity of CVD,
	 * altering the colors to improve accessibility while maintaining as much of the original intent as possible.
	 *
	 * To preview how the original palette would appear to users with CVD, use `simulate`.
	 *
	 * A typical use case would be to generate a normal palette, then fork it and adapt the fork for CVD.
	 * Then you can also preview by chaining `adaptFor` and `simulate`
	 *
	 * e.g.
	 * ```ts
	 * const normalTheme = hextimate('#ff6600');
	 * const cvdTheme = normalTheme.fork().adaptFor('deuteranopia');
	 * const simulatedCVD = normalTheme.fork().simulate('deuteranopia');
	 * ````
	 *
	 * @param type Type of CVD to adapt for (e.g. "protanopia", "deuteranopia", "tritanopia")
	 * @param severity Severity of the CVD adaptation, from 0 (no change) to 1 (full adaptation). Defaults to 1 for a complete adaptation.
	 */
	adaptFor(type: CVDType, severity = 1): this {
		this.operations.push({ method: 'adaptFor', args: [type, severity] });
		this.lightPalette = adaptPalette(this.lightPalette, type, severity);
		this.darkPalette = adaptPalette(this.darkPalette, type, severity);
		return this;
	}

	/**
	 * Creates a new builder instance with the same operations history, allowing you to generate a related palette with a different base color or options.
	 *
	 * e.g. `fork('#ff6677')` creates a new builder with the same
	 * roles, variants, tokens, and adjustments, but based on a different input color.
	 *
	 * `fork({ light: { lightness: 0.8 } })` creates a new builder with the same color but different light theme adjustments.
	 *
	 * @param colorOrOptions Either a new base color for the palette, or an object with new generation options to override (e.g. light/dark adjustments, hue shift, contrast ratio).
	 * @param maybeOptions If the first argument is a color, this can be an optional second argument with generation options to override.
	 * @returns A new builder instance with the same operations history but different base color and/or options.
	 */
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
			newColor = this.inputColor;
			newOptions = {
				...this.options,
				...colorOrOptions,
			} as HextimateGenerationOptions;
		} else if (colorOrOptions !== undefined) {
			newColor = parse(colorOrOptions as ColorInput);
			newOptions = { ...this.options } as HextimateGenerationOptions;
		} else {
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
				case 'preset':
					builder.preset(...op.args);
					break;
			}
		}

		return builder;
	}

	/**
	 * Serializes the palette into the chosen output format.
	 *
	 * When a preset has been applied, its format options are used as defaults.
	 * Any options passed here override the preset's defaults.
	 *
	 * @param options Format options controlling output shape (`as`), color serialization (`colors`), role/variant renaming, and separator.
	 */
	format(
		options: HextimateFormatOptions & { as: 'tailwind' },
	): HextimateResult<NestedTokenMap>;

	format(
		options: HextimateFormatOptions & { as: 'json' | 'tailwind-css' },
	): HextimateResult<string>;

	format(
		options: HextimateFormatOptions & { as: 'object' | 'css' | 'scss' },
	): HextimateResult<FlatTokenMap>;

	format(options?: HextimateFormatOptions): HextimateResult;

	format(options?: HextimateFormatOptions): HextimateResult {
		const mergedOptions = this.presetFormatDefaults
			? {
					...this.presetFormatDefaults,
					...options,
					roleNames: {
						...this.presetFormatDefaults.roleNames,
						...options?.roleNames,
					},
					variantNames: {
						...this.presetFormatDefaults.variantNames,
						...options?.variantNames,
					},
				}
			: options;

		const colorFormat = mergedOptions?.colors ?? 'hex';

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
			light: format(this.lightPalette, mergedOptions, lightTokens),
			dark: format(this.darkPalette, mergedOptions, darkTokens),
		};
	}

	private applyRole(name: string, color: ColorInput): void {
		const parsedColor = parse(color);
		const opts = this.resolvedOptions();

		this.lightPalette[name] = expandColorToScale(parsedColor, 'light', {
			light: opts.light,
			dark: opts.dark,
			minContrastRatio: opts.minContrastRatio,
			hueShift: opts.hueShift,
		});
		this.darkPalette[name] = expandColorToScale(parsedColor, 'dark', {
			light: opts.light,
			dark: opts.dark,
			minContrastRatio: opts.minContrastRatio,
			hueShift: opts.hueShift,
		});
	}

	private applyVariant(name: string, placement: VariantPlacement): void {
		if ('beyond' in placement) {
			const edge = placement.beyond;

			// Place beyond the current edge, then redistribute. If the
			// expanded position would violate the contrast ratio, clamp to
			// the contrast boundary instead.
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
	}

	private applyToken(name: string, value: TokenValue): void {
		this.standaloneTokens.push({ name, value });
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

				// Determine sideDirection per-role by observing where existing
				// variants on this side actually sit relative to DEFAULT.
				// This is necessary because base colors move opposite to accent
				// colors (base weak = darker in light mode, accent weak = lighter).
				const existingVariant = sideVariants.find((v) => scale[v]);
				let sideDirection: number;
				if (existingVariant) {
					const existingL = convert(parse(scale[existingVariant]), 'oklch').l;
					sideDirection =
						Math.sign(existingL - defaultOKLCH.l) ||
						(themeType === 'light' ? 1 : -1);
				} else {
					const contrastDirection = themeType === 'light' ? -1 : 1;
					sideDirection = isStrongSide ? contrastDirection : -contrastDirection;
				}

				const foregroundDirection = Math.sign(
					foregroundOKLCH.l - defaultOKLCH.l,
				);
				const isTowardForeground = sideDirection === foregroundDirection;

				// Find the outermost variant's current distance from DEFAULT.
				let outermostDelta = 0;
				for (const v of sideVariants) {
					if (!scale[v]) continue;
					const vL = convert(parse(scale[v]), 'oklch').l;
					const d = Math.abs(vL - defaultOKLCH.l);
					if (d > outermostDelta) outermostDelta = d;
				}

				let maxDelta: number;
				if (isTowardForeground) {
					const boundaryL = findContrastBoundaryLightness(
						parse(scale.DEFAULT),
						parse(scale.foreground),
						contrastTarget,
					);
					const boundaryDelta =
						boundaryL !== null ? Math.abs(defaultOKLCH.l - boundaryL) : 0;
					// Use the outermost variant's position, but clamp to the
					// contrast boundary so the edge always satisfies contrast.
					maxDelta = Math.min(outermostDelta, boundaryDelta);
				} else {
					const gamutBound = sideDirection > 0 ? 1 : 0;
					const boundaryDelta = Math.min(
						Math.abs(gamutBound - defaultOKLCH.l),
						0.2,
					);
					maxDelta = Math.min(outermostDelta, boundaryDelta);
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
				const direction = foregroundOKLCH.l < variant.l ? 1 : -1;
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

	private resolvedOptions(): HextimateGenerationOptions {
		return { ...this.options } as HextimateGenerationOptions;
	}

	private regenerate(): void {
		const rebuilt = new HextimatePaletteBuilder(
			this.inputColor,
			this.resolvedOptions(),
		);
		for (const op of this.operations) {
			switch (op.method) {
				case 'addRole':
					rebuilt.addRole(...op.args);
					break;
				case 'addVariant':
					rebuilt.addVariant(...op.args);
					break;
				case 'addToken':
					rebuilt.addToken(...op.args);
					break;
				case 'simulate':
					rebuilt.simulate(...op.args);
					break;
				case 'adaptFor':
					rebuilt.adaptFor(...op.args);
					break;
				case 'preset':
					rebuilt.preset(...op.args);
					break;
			}
		}
		this.lightPalette = rebuilt.lightPalette;
		this.darkPalette = rebuilt.darkPalette;
	}
}
