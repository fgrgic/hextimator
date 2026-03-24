import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	convertColor,
	type HextimateFormatOptions,
	type HextimateGenerationOptions,
	hextimate,
	parseColor,
} from 'hextimator';
import { z } from 'zod';

const server = new McpServer({
	name: 'hextimator',
	version: '0.0.1',
});

const generatePaletteShape = {
	color: z
		.string()
		.describe(
			'Input color — hex (#ff6600), CSS function (rgb(255,102,0)), or named color',
		),
	format: z
		.enum(['object', 'css', 'tailwind', 'tailwind-css', 'scss', 'json'])
		.optional()
		.describe('Output format (default: object)'),
	colors: z
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
		.optional()
		.describe('Color value serialization (default: hex)'),
	theme: z
		.enum(['light', 'dark', 'both'])
		.optional()
		.describe('Which theme(s) to return (default: both)'),
	separator: z
		.string()
		.optional()
		.describe('Separator between role and variant in token keys (default: -)'),
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
		.string()
		.optional()
		.describe(
			'WCAG contrast target: "AAA" (default, 7:1), "AA" (4.5:1), or a number',
		),
	lightLightness: z
		.number()
		.optional()
		.describe('Light theme lightness 0-1 (default: 0.7)'),
	darkLightness: z
		.number()
		.optional()
		.describe('Dark theme lightness 0-1 (default: 0.6)'),
	roles: z
		.string()
		.optional()
		.describe(
			'Custom roles as comma-separated "name=color" pairs (e.g. "cta=#ee2244,sidebar=#3a86ff")',
		),
	variants: z
		.string()
		.optional()
		.describe(
			'Custom variants as comma-separated specs: "name:beyond:edge" or "name:between:a+b" (e.g. "hover:beyond:strong,subtle:between:DEFAULT+weak")',
		),
	roleNames: z
		.string()
		.optional()
		.describe(
			'Rename roles in output as JSON (e.g. \'{"accent":"brand","base":"surface"}\')',
		),
	variantNames: z
		.string()
		.optional()
		.describe(
			'Rename variants in output as JSON (e.g. \'{"strong":"primary","foreground":"text"}\')',
		),
};

type GeneratePaletteArgs = z.infer<z.ZodObject<typeof generatePaletteShape>>;

server.registerTool(
	'generate_palette',
	{
		title: 'Generate Color Palette',
		description: `Generate a perceptually uniform color palette with light and dark themes from a single brand/accent color.

Returns color tokens in the requested format. Default palette has 5 roles (base, accent, positive, negative, warning) × 4 variants (DEFAULT, strong, weak, foreground) = 20 tokens.

Roles: use --role to add custom color roles (e.g. "cta=#ff0066"). Each gets its own full scale.
Variants: use --variant to add lightness steps (e.g. "hover:beyond:strong" or "subtle:between:DEFAULT,weak").
Renaming: use roleNames/variantNames as JSON to rename output keys (e.g. '{"accent":"brand"}').`,
		inputSchema: generatePaletteShape,
	},
	async (args: GeneratePaletteArgs) => {
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
		} = args;
		const generationOptions: HextimateGenerationOptions = {};

		if (baseColor) generationOptions.baseColor = baseColor;
		if (baseHueShift !== undefined)
			generationOptions.baseHueShift = baseHueShift;
		if (hueShift !== undefined) generationOptions.hueShift = hueShift;
		if (minContrastRatio !== undefined) {
			if (minContrastRatio === 'AAA' || minContrastRatio === 'AA') {
				generationOptions.minContrastRatio = minContrastRatio;
			} else {
				generationOptions.minContrastRatio = Number(minContrastRatio);
			}
		}
		if (lightLightness !== undefined)
			generationOptions.light = { lightness: lightLightness };
		if (darkLightness !== undefined)
			generationOptions.dark = { lightness: darkLightness };

		const builder = hextimate(color, generationOptions);

		if (roles) {
			for (const pair of roles.split(',')) {
				const eq = pair.indexOf('=');
				if (eq !== -1) {
					builder.addRole(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
				}
			}
		}

		if (variants) {
			for (const spec of variants.split(',')) {
				const parts = spec.trim().split(':');
				if (parts.length >= 3) {
					const [name, type, ref] = parts;
					if (type === 'beyond') {
						builder.addVariant(name, { beyond: ref });
					} else if (type === 'between') {
						const [a, b] = ref.split('+');
						builder.addVariant(name, { between: [a, b] });
					}
				}
			}
		}

		const formatOptions: HextimateFormatOptions = {
			as: format ?? 'object',
			colors: colors ?? 'hex',
			separator: separator ?? '-',
		};

		if (roleNames) {
			formatOptions.roleNames = JSON.parse(roleNames);
		}
		if (variantNames) {
			formatOptions.variantNames = JSON.parse(variantNames);
		}

		const result = builder.format(formatOptions);
		const themeFilter = theme ?? 'both';

		let output: unknown;
		if (themeFilter === 'light') output = result.light;
		else if (themeFilter === 'dark') output = result.dark;
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
			to: z
				.enum(['srgb', 'hsl', 'oklch', 'oklab', 'linear-rgb', 'display-p3'])
				.describe('Target color space'),
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
