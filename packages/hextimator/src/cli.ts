import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { hextimate } from './index';
import * as presets from './presets';
import type { HextimatePreset } from './presets/types';
import type {
	ColorFormat,
	HextimateFormatOptions,
	HextimateGenerationOptions,
} from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_VERSION: string = JSON.parse(
	readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
).version;

const AVAILABLE_PRESETS: Record<string, HextimatePreset> = {
	shadcn: presets.shadcn,
	mui: presets.mui,
	muted: presets.muted,
	vibrant: presets.vibrant,
	tinted: presets.tinted,
};

const HELP = `
hextimator <color> [options]

Generate a perceptually uniform color palette from a single color.

Arguments:
  color                       Input color (quote hex values: '#ff6600')

Presets:
  -p, --preset <name>         Apply a preset (repeatable, applied in order):
                              Framework: shadcn, mui
                              Style:     muted, vibrant, tinted

Format options:
  -f, --format <type>         css | object | tailwind | tailwind-css | scss | json  (default: css)
  -c, --colors <type>         hex | rgb | hsl | oklch | p3 and -raw variants        (default: hex)
  -t, --theme <type>          light | dark | both                                   (default: both)
      --separator <char>      Token separator                                       (default: -)

Generation options:
      --base-color <color>    Override base/neutral color
      --base-hue-shift <deg>  Rotate base hue relative to accent
      --hue-shift <deg>       Per-variant hue shift in degrees
      --base-max-chroma <n>   Max chroma for base colors          (default: 0.01)
      --fg-max-chroma <n>     Max chroma for foreground colors     (default: 0.01)
      --light-lightness <n>   Light theme lightness 0-1            (default: 0.7)
      --light-max-chroma <n>  Light theme max chroma
      --dark-lightness <n>    Dark theme lightness 0-1             (default: 0.6)
      --dark-max-chroma <n>   Dark theme max chroma
      --min-contrast <value>  AAA | AA | <number>                  (default: AAA)
      --invert-dark           Swap base/accent hues in dark mode   (requires --base-color)

Semantic colors:
      --positive <color>      Override positive/success color      (default: auto green)
      --negative <color>      Override negative/error color        (default: auto red)
      --warning <color>       Override warning color               (default: auto amber)

CVD (color vision deficiency):
      --simulate <type>       Simulate CVD: protanopia | deuteranopia | tritanopia | achromatopsia
      --adapt <type>          Adapt palette for CVD type
      --cvd-severity <n>      CVD severity 0-1                     (default: 1)

Roles & variants (repeatable):
      --role <name>=<color>   Add a custom role
      --variant <spec>        from:    "name:from:edge"
                              between: "name:between:a,b"

Output:
  -o, --output <path>         Write to file instead of stdout
  -h, --help                  Show this help
  -v, --version               Show version

Examples:
  hextimator '#ff6600'
  hextimator '#ff6600' --format tailwind-css --colors oklch
  hextimator '#3366cc' --format json --theme light
  hextimator '#6366F1' --preset shadcn
  hextimator '#6366F1' --preset muted --preset shadcn
  hextimator '#6366F1' --preset shadcn --colors hsl-raw
  hextimator '#22aa44' --role cta=#ee2244 --variant hover:from:strong -o theme.css
  hextimator '#6A5ACD' --base-color '#FEBA5D' --invert-dark
  hextimator '#ff6600' --simulate deuteranopia
  hextimator '#ff6600' --adapt deuteranopia --cvd-severity 0.8
`.trim();

function run(): void {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: {
			preset: { type: 'string', short: 'p', multiple: true },
			format: { type: 'string', short: 'f' },
			colors: { type: 'string', short: 'c' },
			theme: { type: 'string', short: 't', default: 'both' },
			separator: { type: 'string' },
			'base-color': { type: 'string' },
			'base-hue-shift': { type: 'string' },
			'hue-shift': { type: 'string' },
			'base-max-chroma': { type: 'string' },
			'fg-max-chroma': { type: 'string' },
			'light-lightness': { type: 'string' },
			'light-max-chroma': { type: 'string' },
			'dark-lightness': { type: 'string' },
			'dark-max-chroma': { type: 'string' },
			'min-contrast': { type: 'string' },
			'invert-dark': { type: 'boolean' },
			positive: { type: 'string' },
			negative: { type: 'string' },
			warning: { type: 'string' },
			simulate: { type: 'string' },
			adapt: { type: 'string' },
			'cvd-severity': { type: 'string' },
			role: { type: 'string', multiple: true },
			variant: { type: 'string', multiple: true },
			output: { type: 'string', short: 'o' },
			help: { type: 'boolean', short: 'h' },
			version: { type: 'boolean', short: 'v' },
		},
	});

	if (values.help) {
		console.log(HELP);
		process.exit(0);
	}

	if (values.version) {
		console.log(PKG_VERSION);
		process.exit(0);
	}

	const color = positionals[0];
	if (!color) {
		console.error('Error: missing color argument. Run with --help for usage.');
		process.exit(1);
	}

	const generationOptions: HextimateGenerationOptions = {};

	if (values['base-color']) generationOptions.baseColor = values['base-color'];
	if (values['base-hue-shift'])
		generationOptions.baseHueShift = Number(values['base-hue-shift']);
	if (values['hue-shift'])
		generationOptions.hueShift = Number(values['hue-shift']);
	if (values['base-max-chroma'])
		generationOptions.baseMaxChroma = Number(values['base-max-chroma']);
	if (values['fg-max-chroma'])
		generationOptions.foregroundMaxChroma = Number(values['fg-max-chroma']);

	if (values['light-lightness'] || values['light-max-chroma']) {
		generationOptions.light = {};
		if (values['light-lightness'])
			generationOptions.light.lightness = Number(values['light-lightness']);
		if (values['light-max-chroma'])
			generationOptions.light.maxChroma = Number(values['light-max-chroma']);
	}

	if (values['dark-lightness'] || values['dark-max-chroma']) {
		generationOptions.dark = {};
		if (values['dark-lightness'])
			generationOptions.dark.lightness = Number(values['dark-lightness']);
		if (values['dark-max-chroma'])
			generationOptions.dark.maxChroma = Number(values['dark-max-chroma']);
	}

	if (values['min-contrast']) {
		const mc = values['min-contrast'];
		if (mc === 'AAA' || mc === 'AA') {
			generationOptions.minContrastRatio = mc;
		} else {
			generationOptions.minContrastRatio = Number(mc);
		}
	}

	if (values['invert-dark']) {
		generationOptions.invertDarkModeBaseAccent = true;
	}

	const semanticColors: HextimateGenerationOptions['semanticColors'] = {};
	if (values.positive) semanticColors.positive = values.positive;
	if (values.negative) semanticColors.negative = values.negative;
	if (values.warning) semanticColors.warning = values.warning;
	if (Object.keys(semanticColors).length > 0) {
		generationOptions.semanticColors = semanticColors;
	}

	const builder = hextimate(color, generationOptions);

	if (values.preset) {
		for (const name of values.preset) {
			const preset = AVAILABLE_PRESETS[name];
			if (!preset) {
				console.error(
					`Error: unknown preset "${name}". Available: ${Object.keys(AVAILABLE_PRESETS).join(', ')}`,
				);
				process.exit(1);
			}
			builder.preset(preset);
		}
	}

	if (values.role) {
		for (const r of values.role) {
			const eq = r.indexOf('=');
			if (eq === -1) {
				console.error(
					`Error: invalid --role "${r}". Expected format: name=color`,
				);
				process.exit(1);
			}
			builder.addRole(r.slice(0, eq), r.slice(eq + 1));
		}
	}

	if (values.variant) {
		for (const v of values.variant) {
			const parts = v.split(':');
			if (parts.length < 3) {
				console.error(
					`Error: invalid --variant "${v}". Expected "name:from:edge" or "name:between:a,b"`,
				);
				process.exit(1);
			}
			const [name, type, ref] = parts;
			if (type === 'from') {
				builder.addVariant(name, { from: ref });
			} else if (type === 'between') {
				const refs = ref.split(',');
				if (refs.length !== 2) {
					console.error(
						`Error: invalid --variant between spec "${v}". Expected "name:between:a,b"`,
					);
					process.exit(1);
				}
				builder.addVariant(name, { between: [refs[0], refs[1]] });
			} else {
				console.error(
					`Error: invalid --variant type "${type}". Expected "from" or "between"`,
				);
				process.exit(1);
			}
		}
	}

	const cvdSeverity = values['cvd-severity']
		? Number(values['cvd-severity'])
		: 1;

	if (values.simulate) {
		builder.simulate(
			values.simulate as
				| 'protanopia'
				| 'deuteranopia'
				| 'tritanopia'
				| 'achromatopsia',
			cvdSeverity,
		);
	}

	if (values.adapt) {
		builder.adaptFor(
			values.adapt as
				| 'protanopia'
				| 'deuteranopia'
				| 'tritanopia'
				| 'achromatopsia',
			cvdSeverity,
		);
	}

	const hasPreset = values.preset && values.preset.length > 0;
	const formatOptions: HextimateFormatOptions = {};
	if (values.format) {
		formatOptions.as = values.format as HextimateFormatOptions['as'];
	} else if (!hasPreset) {
		formatOptions.as = 'css';
	}
	if (values.colors) {
		formatOptions.colors = values.colors as ColorFormat;
	} else if (!hasPreset) {
		formatOptions.colors = 'hex';
	}
	if (values.separator) {
		formatOptions.separator = values.separator;
	} else if (!hasPreset) {
		formatOptions.separator = '-';
	}

	const result = builder.format(formatOptions);
	const themeFilter = values.theme as string;

	let output: string;
	if (themeFilter === 'light') {
		output = serialize(result.light);
	} else if (themeFilter === 'dark') {
		output = serialize(result.dark);
	} else {
		output = serialize({ light: result.light, dark: result.dark });
	}

	if (values.output) {
		writeFileSync(values.output, `${output}\n`);
	} else {
		console.log(output);
	}
}

function serialize(value: unknown): string {
	if (typeof value === 'string') return value;
	return JSON.stringify(value, null, 2);
}

try {
	run();
} catch (err) {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
}
