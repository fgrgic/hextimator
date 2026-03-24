import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	convertColor,
	type HextimateFormatOptions,
	type HextimateGenerationOptions,
	hextimate,
	parseColor,
} from 'hextimator';
import { type ZodType, z } from 'zod';

const server = new McpServer({
	name: 'hextimator',
	version: '0.0.1',
});

// Wrapping in `as ZodType<T>` cuts Zod's deep recursive inference that
// causes "Type instantiation is excessively deep" with complex schemas.

const formatEnum = z
	.enum(['object', 'css', 'tailwind', 'tailwind-css', 'scss', 'json'])
	.default('object')
	.describe('Output format') as ZodType<
	'object' | 'css' | 'tailwind' | 'tailwind-css' | 'scss' | 'json'
>;

const colorsEnum = z
	.enum([
		'hex',
		'rgb',
		'rgb-raw',
		'hsl',
		'hsl-raw',
		'oklch',
		'oklch-raw',
		'p3',
		'p3-raw',
	])
	.default('hex')
	.describe('Color value serialization') as ZodType<
	| 'hex'
	| 'rgb'
	| 'rgb-raw'
	| 'hsl'
	| 'hsl-raw'
	| 'oklch'
	| 'oklch-raw'
	| 'p3'
	| 'p3-raw'
>;

const themeEnum = z
	.enum(['light', 'dark', 'both'])
	.default('both')
	.describe('Which theme(s) to return') as ZodType<'light' | 'dark' | 'both'>;

const colorSpaceEnum = z
	.enum(['srgb', 'hsl', 'oklch', 'oklab', 'linear-rgb', 'display-p3'])
	.describe('Target color space') as ZodType<
	'srgb' | 'hsl' | 'oklch' | 'oklab' | 'linear-rgb' | 'display-p3'
>;

interface PaletteInput {
	color: string;
	format: 'object' | 'css' | 'tailwind' | 'tailwind-css' | 'scss' | 'json';
	colors:
		| 'hex'
		| 'rgb'
		| 'rgb-raw'
		| 'hsl'
		| 'hsl-raw'
		| 'oklch'
		| 'oklch-raw'
		| 'p3'
		| 'p3-raw';
	theme: 'light' | 'dark' | 'both';
	separator: string;
	baseColor?: string;
	baseHueShift?: number;
	hueShift?: number;
	minContrastRatio: 'AAA' | 'AA' | number;
	lightLightness?: number;
	darkLightness?: number;
	roles?: Array<{ name: string; color: string }>;
	variants?: Array<{ name: string; type: 'beyond' | 'between'; ref: string }>;
	roleNames?: Record<string, string>;
	variantNames?: Record<string, string>;
}

server.registerTool(
	'generate_palette',
	{
		title: 'Generate Color Palette',
		description:
			'Generate a perceptually uniform color palette with light and dark themes from a single brand/accent color. Returns color tokens in the requested format.',
		inputSchema: {
			color: z
				.string()
				.describe(
					'Input color — hex (#ff6600), CSS function (rgb(255,102,0)), or named color',
				),
			format: formatEnum,
			colors: colorsEnum,
			theme: themeEnum,
			separator: z
				.string()
				.default('-')
				.describe('Separator between role and variant in token keys'),
			baseColor: z
				.string()
				.optional()
				.describe('Override base/neutral color instead of auto-deriving'),
			baseHueShift: z
				.number()
				.optional()
				.describe(
					'Rotate base hue relative to accent (degrees). 180 = complementary',
				),
			hueShift: z
				.number()
				.optional()
				.describe('Per-variant hue rotation (degrees)'),
			minContrastRatio: z
				.union([z.enum(['AAA', 'AA']), z.number()])
				.default('AAA')
				.describe(
					'WCAG contrast target. AAA=7, AA=4.5, or a number',
				) as ZodType<'AAA' | 'AA' | number>,
			lightLightness: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe('Light theme lightness (0-1, default 0.7)'),
			darkLightness: z
				.number()
				.min(0)
				.max(1)
				.optional()
				.describe('Dark theme lightness (0-1, default 0.6)'),
			roles: z
				.array(
					z.object({
						name: z.string().describe('Role name (e.g. "cta", "sidebar")'),
						color: z.string().describe('Base color for the role'),
					}),
				)
				.optional()
				.describe('Additional color roles beyond the built-in 5') as ZodType<
				Array<{ name: string; color: string }> | undefined
			>,
			variants: z
				.array(
					z.object({
						name: z.string().describe('Variant name (e.g. "hover", "subtle")'),
						type: z.enum(['beyond', 'between']),
						ref: z
							.string()
							.describe(
								'For beyond: edge variant name. For between: "a,b" comma-separated pair',
							),
					}),
				)
				.optional()
				.describe(
					'Additional lightness variants beyond the built-in 4',
				) as ZodType<
				| Array<{
						name: string;
						type: 'beyond' | 'between';
						ref: string;
				  }>
				| undefined
			>,
			roleNames: z
				.record(z.string(), z.string())
				.optional()
				.describe(
					'Rename roles in output (e.g. { accent: "brand", base: "surface" })',
				) as ZodType<Record<string, string> | undefined>,
			variantNames: z
				.record(z.string(), z.string())
				.optional()
				.describe(
					'Rename variants in output (e.g. { strong: "primary", foreground: "text" })',
				) as ZodType<Record<string, string> | undefined>,
		},
	},
	async (input: PaletteInput) => {
		const {
			color,
			format,
			colors,
			theme,
			separator,
			baseColor,
			baseHueShift,
			hueShift,
			minContrastRatio,
			lightLightness,
			darkLightness,
			roles,
			variants,
			roleNames,
			variantNames,
		} = input;

		const generationOptions: HextimateGenerationOptions = {};

		if (baseColor) generationOptions.baseColor = baseColor;
		if (baseHueShift !== undefined)
			generationOptions.baseHueShift = baseHueShift;
		if (hueShift !== undefined) generationOptions.hueShift = hueShift;
		if (minContrastRatio !== undefined)
			generationOptions.minContrastRatio = minContrastRatio;
		if (lightLightness !== undefined)
			generationOptions.light = { lightness: lightLightness };
		if (darkLightness !== undefined)
			generationOptions.dark = { lightness: darkLightness };

		const builder = hextimate(color, generationOptions);

		if (roles) {
			for (const { name, color: roleColor } of roles) {
				builder.addRole(name, roleColor);
			}
		}

		if (variants) {
			for (const { name, type, ref } of variants) {
				if (type === 'beyond') {
					builder.addVariant(name, { beyond: ref });
				} else {
					const [a, b] = ref.split(',');
					builder.addVariant(name, { between: [a, b] });
				}
			}
		}

		const formatOptions: HextimateFormatOptions = {
			as: format,
			colors,
			separator,
			roleNames,
			variantNames,
		};

		const result = builder.format(formatOptions);

		let output: unknown;
		if (theme === 'light') output = result.light;
		else if (theme === 'dark') output = result.dark;
		else output = result;

		return {
			content: [
				{
					type: 'text' as const,
					text:
						typeof output === 'string'
							? output
							: JSON.stringify(output, null, 2),
				},
			],
		};
	},
);

server.registerTool(
	'parse_color',
	{
		title: 'Parse Color',
		description:
			'Parse any color input (hex, RGB, HSL, CSS function, tuple, numeric) into a normalized Color object with its color space and components.',
		inputSchema: {
			color: z
				.string()
				.describe(
					'Color to parse — hex (#ff6600), CSS function (rgb(255,102,0)), etc.',
				),
		},
	},
	async ({ color }) => {
		const parsed = parseColor(color);
		return {
			content: [
				{
					type: 'text' as const,
					text: JSON.stringify(parsed, null, 2),
				},
			],
		};
	},
);

server.registerTool(
	'convert_color',
	{
		title: 'Convert Color',
		description:
			'Convert a color from one color space to another. Supports sRGB, HSL, OKLCH, OKLab, Linear RGB, and Display P3.',
		inputSchema: {
			color: z
				.string()
				.describe('Color to convert (any supported input format)'),
			to: colorSpaceEnum,
		},
	},
	async ({ color, to }) => {
		const parsed = parseColor(color);
		const converted = convertColor(parsed, to);
		return {
			content: [
				{
					type: 'text' as const,
					text: JSON.stringify(converted, null, 2),
				},
			],
		};
	},
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error('hextimator MCP server running on stdio');
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
