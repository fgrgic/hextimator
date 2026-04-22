import { adaptPalette, type CVDType, simulatePalette } from './a11y';
import { convert } from './convert';
import type { FlatTokenMap, FormatResult, NestedTokenMap } from './format';
import { format, formatStylesheet } from './format';
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
	HextimateStyleOptions,
	OKLCH,
} from './types';

/** The result of formatting a palette, containing both light and dark theme tokens. */
export interface HextimateResult<F = FormatResult> {
	light: F;
	dark: F;
}

/**
 * Where to place a new variant relative to existing ones.
 * - `{ from: "strong" }` — one step past the named variant (redistributes to respect contrast)
 * - `{ from: "weak", chroma: -0.02 }` — one step past weak, with a chroma offset
 * - `{ between: ["DEFAULT", "weak"] }` — midpoint between two variants
 */
export type VariantPlacement =
	| { from: string; emphasis?: number; chroma?: number; hue?: number }
	| { between: [string, string] };

/**
 * A token derived from an existing role+variant, with optional offsets.
 *
 * `emphasis` is theme-aware: positive = more contrast with background,
 * negative = softer/closer to background. It flips direction automatically
 * between light and dark themes, so you never need per-theme splits for
 * simple contrast adjustments.
 *
 * @example
 * { from: "surface.weak", lightness: -0.05 }
 * { from: "accent", hue: -20 }
 * { from: "surface", emphasis: 0.12 }
 * { from: "surface.foreground", emphasis: -0.2 }
 */
export interface DerivedToken {
	from: string;
	emphasis?: number;
	lightness?: number;
	chroma?: number;
	hue?: number;
}

/**
 * Value for a standalone token: a raw color, a derived reference, or per-theme values.
 *
 * @example
 * "#FF6600"
 * { from: "accent", lightness: +0.1 }
 * { light: { from: "surface.weak", lightness: -0.05 }, dark: { from: "surface.weak", lightness: +0.05 } }
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
const NESTED_GEN_KEYS = new Set([
	'light',
	'dark',
	'semanticColors',
	'semanticColorRanges',
]);

/** Sequential merge for style options. Nested keys `light`, `dark`, `semanticColors`, `semanticColorRanges` shallow-merge per key; other keys overwrite. Later sources win. */
function mergeStyleOptions(
	...sources: (Partial<HextimateStyleOptions> | undefined)[]
): Partial<HextimateStyleOptions> {
	const result: Record<string, unknown> = {};
	for (const source of sources) {
		if (!source) continue;
		for (const [key, value] of Object.entries(source)) {
			if (value === undefined) continue;
			if (
				NESTED_GEN_KEYS.has(key) &&
				typeof value === 'object' &&
				value !== null
			) {
				result[key] = { ...(result[key] as Record<string, unknown>), ...value };
			} else {
				result[key] = value;
			}
		}
	}
	return result as Partial<HextimateStyleOptions>;
}

export class HextimatePaletteBuilder {
	private lightPalette!: HextimatePalette;
	private darkPalette!: HextimatePalette;
	private readonly inputColor: Color;
	private options: Partial<HextimateStyleOptions>;
	private readonly operations: Array<
		| { method: 'addRole'; args: [string, ColorInput | DerivedToken] }
		| { method: 'addVariant'; args: [string, VariantPlacement] }
		| { method: 'addToken'; args: [string, TokenValue] }
		| { method: 'simulate'; args: [CVDType, number] }
		| { method: 'adaptFor'; args: [CVDType, number] }
		| { method: 'preset'; args: [HextimatePreset] }
		| { method: 'style'; args: [Partial<HextimateStyleOptions>] }
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

	constructor(color: Color) {
		this.inputColor = color;
		this.options = {};
		this.seedOptionsForFork({});
	}

	/**
	 * Merges style options into the builder and regenerates the palettes,
	 * then replays recorded operations so roles and variants reflect the new style.
	 */
	style(partial: Partial<HextimateStyleOptions>): this {
		this.operations.push({ method: 'style', args: [partial] });
		this.options = mergeStyleOptions(this.options, partial);
		this.rebuildFromOperations();
		return this;
	}

	private seedOptionsForFork(
		seededOptions: Partial<HextimateStyleOptions>,
	): void {
		this.options = { ...seededOptions };
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
		this.standaloneTokens.length = 0;
		this.weakSideVariants.length = 0;
		this.weakSideVariants.push('weak');
		this.strongSideVariants.length = 0;
		this.strongSideVariants.push('strong');
		this.betweenVariants.length = 0;
		this.presetFormatDefaults = undefined;
		this.applyToken('brand-exact', this.inputColor);

		const colorOKLCH = convert(this.inputColor, 'oklch');
		const lightFg = { ...colorOKLCH, l: 0.97, c: Math.min(colorOKLCH.c, 0.01) };
		const darkFg = { ...colorOKLCH, l: 0.1, c: Math.min(colorOKLCH.c, 0.01) };
		const brandForeground =
			calculateContrast(this.inputColor, lightFg) >=
			calculateContrast(this.inputColor, darkFg)
				? lightFg
				: darkFg;
		this.applyToken('brand-exact-foreground', brandForeground);
	}

	private rebuildFromOperations(): void {
		this.seedOptionsForFork(this.options);
		for (const op of this.operations) {
			this.replayOperationInPlace(op);
		}
	}

	private replayOperationInPlace(
		op:
			| { method: 'addRole'; args: [string, ColorInput | DerivedToken] }
			| { method: 'addVariant'; args: [string, VariantPlacement] }
			| { method: 'addToken'; args: [string, TokenValue] }
			| { method: 'simulate'; args: [CVDType, number] }
			| { method: 'adaptFor'; args: [CVDType, number] }
			| { method: 'preset'; args: [HextimatePreset] }
			| { method: 'style'; args: [Partial<HextimateStyleOptions>] },
	): void {
		switch (op.method) {
			case 'style':
				return;
			case 'addRole':
				this.applyRole(...op.args);
				return;
			case 'addVariant':
				this.applyVariant(...op.args);
				return;
			case 'addToken':
				this.applyToken(...op.args);
				return;
			case 'simulate':
				this.lightPalette = simulatePalette(
					this.lightPalette,
					op.args[0],
					op.args[1],
				);
				this.darkPalette = simulatePalette(
					this.darkPalette,
					op.args[0],
					op.args[1],
				);
				return;
			case 'adaptFor':
				this.lightPalette = adaptPalette(
					this.lightPalette,
					op.args[0],
					op.args[1],
				);
				this.darkPalette = adaptPalette(
					this.darkPalette,
					op.args[0],
					op.args[1],
				);
				return;
			case 'preset':
				this.applyPresetRolesTokensFormat(op.args[0]);
				return;
		}
	}

	/**
	 * Adds a custom role with given name and color.
	 * The color is expanded into a full scale and added to both light and dark palettes.
	 *
	 * The color can be a direct color value or a derived token referencing an existing role.
	 *
	 * e.g. `addRole('cta', '#ff0066')` adds a "cta" role with the specified color.
	 * `addRole('cta', { from: 'accent', hue: 180 })` adds a "cta" role with a complementary hue to accent.
	 *
	 * @param name Role name (e.g. "cta", "banner")
	 * @param color Base color or derived token for the role
	 */
	addRole(name: string, color: ColorInput | DerivedToken): this {
		this.operations.push({ method: 'addRole', args: [name, color] });
		this.applyRole(name, color);
		return this;
	}

	/**
	 * Adds a variant to all roles, derived from an existing variant or placed between two variants.
	 *
	 * e.g. `addVariant('placeholder', { from: 'weak' })` adds a "placeholder" variant one step past "weak" across all roles and themes.
	 * `addVariant('highlight', { between: ['DEFAULT', 'strong'] })` adds a "highlight" variant that is exactly between "DEFAULT" and "strong" across all roles and themes.
	 *
	 * @param name Variant name (e.g. "placeholder", "highlight")
	 * @param placement Placement of the variant, either `{ from: 'weak' }` or `{ between: ['DEFAULT', 'strong'] }`
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
	 * `addToken('surface-strong', '#ff0066')` overrides the automatically generated "surface-strong" variant with a custom color.
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
	 * Preset format defaults are used as defaults in `.format()` — any options
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
		if (preset.style) {
			this.options = mergeStyleOptions(this.options, preset.style);
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
		this.applyPresetRolesTokensFormat(preset);
		return this;
	}

	/**
	 * Records a preset in the operation log and applies roles, variants, tokens, and format.
	 * Does not merge `preset.style` — used when replaying onto a builder whose `this.options` already reflect merged style.
	 */
	private recordPresetWithoutStyleMerge(preset: HextimatePreset): void {
		this.operations.push({ method: 'preset', args: [preset] });
		this.applyPresetRolesTokensFormat(preset);
	}

	/** Roles, variants, tokens, and format only — `this.options` and palettes are already correct. */
	private applyPresetRolesTokensFormat(preset: HextimatePreset): void {
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
	 * Creates a new builder instance with the same operations history, optionally from a different accent color.
	 * To change style options on the fork, chain `.style()` after `.fork()`.
	 *
	 * @param color Optional new accent/brand color. If omitted, the fork uses the same color as this builder.
	 */
	fork(color?: ColorInput): HextimatePaletteBuilder {
		const newColor = color !== undefined ? parse(color) : this.inputColor;
		const builder = new HextimatePaletteBuilder(newColor);
		builder.seedOptionsForFork({ ...this.options });

		for (const op of this.operations) {
			switch (op.method) {
				case 'style':
					break;
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
					builder.recordPresetWithoutStyleMerge(op.args[0]);
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
		options: HextimateFormatOptions & { as: 'json' },
	): HextimateResult<string>;

	format(
		options: HextimateFormatOptions & { as: 'css' | 'tailwind-css' },
	): string;

	format(
		options: HextimateFormatOptions & { as: 'object' | 'scss' },
	): HextimateResult<FlatTokenMap>;

	format(options?: HextimateFormatOptions): HextimateResult | string;

	format(options?: HextimateFormatOptions): HextimateResult | string {
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

		if (mergedOptions?.as === 'css' || mergedOptions?.as === 'tailwind-css') {
			return formatStylesheet(
				this.lightPalette,
				this.darkPalette,
				mergedOptions,
				lightTokens,
				darkTokens,
			);
		}

		return {
			light: format(this.lightPalette, mergedOptions, lightTokens),
			dark: format(this.darkPalette, mergedOptions, darkTokens),
		};
	}

	private applyRole(name: string, color: ColorInput | DerivedToken): void {
		const parsedColor = this.isDerivedToken(color)
			? this.resolveDerivedToken(color, this.lightPalette, 'light')
			: parse(color);
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
		if ('from' in placement) {
			const edge = placement.from;

			// Place one step past the edge variant, then redistribute.
			// If the expanded position would violate the contrast ratio,
			// clamp to the contrast boundary instead.
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

			// Apply optional offsets (chroma, hue) after redistribution
			if (placement.chroma || placement.hue) {
				for (const palette of [this.lightPalette, this.darkPalette]) {
					for (const role of Object.keys(palette)) {
						const scale = palette[role];
						const oklch = convert(parse(scale[name]), 'oklch');
						scale[name] = {
							...oklch,
							c: Math.max(0, oklch.c + (placement.chroma ?? 0)),
							h: wrapHue(oklch.h + (placement.hue ?? 0)),
						};
					}
				}
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
			return this.resolveTokenSingle(themeValue, palette, themeType);
		}

		return this.resolveTokenSingle(
			value as DerivedToken | ColorInput,
			palette,
			themeType,
		);
	}

	private resolveTokenSingle(
		value: DerivedToken | ColorInput,
		palette: HextimatePalette,
		themeType: 'light' | 'dark',
	): Color {
		if (this.isDerivedToken(value)) {
			return this.resolveDerivedToken(value, palette, themeType);
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
		themeType: 'light' | 'dark',
		resolving?: Set<string>,
	): Color {
		const [role, variant = 'DEFAULT'] = token.from.split('.');
		const scale = palette[role];

		let sourceColor: ColorInput | undefined;

		if (scale) {
			sourceColor = scale[variant];
			if (!sourceColor) {
				throw new Error(
					`Unknown variant "${variant}" in token reference "${token.from}"`,
				);
			}
		} else {
			const standalone = this.standaloneTokens.find((t) => t.name === role);
			if (!standalone) {
				throw new Error(
					`Unknown role "${role}" in token reference "${token.from}"`,
				);
			}
			const seen = resolving ?? new Set<string>();
			if (seen.has(role)) {
				throw new Error(`Circular token reference detected: "${token.from}"`);
			}
			seen.add(role);
			sourceColor = this.resolveTokenValueWithChain(
				standalone.value,
				themeType,
				palette,
				seen,
			);
		}

		const oklch = convert(parse(sourceColor), 'oklch');

		let emphasisOffset = 0;
		if (token.emphasis) {
			// Determine contrast direction for this theme:
			// In light mode, more contrast = darker (negative L), so emphasis > 0 → L decreases.
			// In dark mode, more contrast = lighter (positive L), so emphasis > 0 → L increases.
			// This works for both surface (background-like) and accent roles because
			// we use the theme direction, not the role's foreground direction.
			const contrastDirection = themeType === 'light' ? -1 : 1;
			emphasisOffset = token.emphasis * contrastDirection;
		}

		return {
			...oklch,
			l: Math.max(
				0,
				Math.min(1, oklch.l + (token.lightness ?? 0) + emphasisOffset),
			),
			c: Math.max(0, oklch.c + (token.chroma ?? 0)),
			h: wrapHue(oklch.h + (token.hue ?? 0)),
		};
	}

	private resolveTokenValueWithChain(
		value: TokenValue,
		themeType: 'light' | 'dark',
		palette: HextimatePalette,
		resolving: Set<string>,
	): Color {
		if (
			typeof value === 'object' &&
			value !== null &&
			!Array.isArray(value) &&
			'light' in value &&
			'dark' in value
		) {
			const themeValue = themeType === 'light' ? value.light : value.dark;
			return this.resolveTokenSingleWithChain(
				themeValue,
				palette,
				themeType,
				resolving,
			);
		}
		return this.resolveTokenSingleWithChain(
			value as DerivedToken | ColorInput,
			palette,
			themeType,
			resolving,
		);
	}

	private resolveTokenSingleWithChain(
		value: DerivedToken | ColorInput,
		palette: HextimatePalette,
		themeType: 'light' | 'dark',
		resolving: Set<string>,
	): Color {
		if (this.isDerivedToken(value)) {
			return this.resolveDerivedToken(value, palette, themeType, resolving);
		}
		return parse(value);
	}

	private getSideVariantsFor(variantName: string): string[] | null {
		if (this.weakSideVariants.includes(variantName)) {
			return this.weakSideVariants;
		}
		if (this.strongSideVariants.includes(variantName)) {
			return this.strongSideVariants;
		}

		const sampleRole = Object.keys(this.lightPalette).find(
			(r) => r !== 'surface',
		);
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
				// This is necessary because surface colors move opposite to accent
				// colors (surface weak = darker in light mode, accent weak = lighter).
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

	private resolvedOptions(): HextimateStyleOptions {
		return { ...this.options } as HextimateStyleOptions;
	}
}
