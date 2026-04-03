import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

type CompletionEntry = {
	label: string;
	type: string;
	info?: string;
	detail?: string;
	apply?: string;
};

const BUILDER_METHODS: CompletionEntry[] = [
	{ label: 'addRole', type: 'method', detail: "(name, color)", info: "Add a named color role to the palette", apply: "addRole('name', '#color')" },
	{ label: 'addVariant', type: 'method', detail: "(name, placement)", info: "Add a variant (e.g. hover, muted)", apply: "addVariant('name', { beyond: 'strong' })" },
	{ label: 'addToken', type: 'method', detail: "(name, value)", info: "Add a standalone token", apply: "addToken('name', { from: 'accent' })" },
	{ label: 'preset', type: 'method', detail: "(preset)", info: "Apply a preset configuration", apply: "preset(presets.shadcn)" },
	{ label: 'light', type: 'method', detail: "(adjustments)", info: "Light theme overrides (lightness, maxChroma)", apply: "light({ lightness: 0.7 })" },
	{ label: 'dark', type: 'method', detail: "(adjustments)", info: "Dark theme overrides (lightness, maxChroma)", apply: "dark({ lightness: 0.6 })" },
	{ label: 'simulate', type: 'method', detail: "(type, severity?)", info: "Preview CVD simulation (deuteranopia, protanopia, tritanopia, achromatopsia)", apply: "simulate('deuteranopia')" },
	{ label: 'adaptFor', type: 'method', detail: "(type, severity?)", info: "Adapt palette for color vision deficiency", apply: "adaptFor('deuteranopia')" },
	{ label: 'fork', type: 'method', detail: "(color?, options?)", info: "Create a new builder with same operations but different color", apply: "fork('#color')" },
	{ label: 'format', type: 'method', detail: "(options)", info: "Format the palette for output", apply: "format({ as: 'css', colors: 'hex' })" },
];

const GENERATION_OPTIONS: CompletionEntry[] = [
	{ label: 'baseColor', type: 'property', info: "Base color for the theme. Takes precedence over baseHueShift", detail: "ColorInput" },
	{ label: 'baseHueShift', type: 'property', info: "Rotate base hue relative to accent (degrees). Default: 0", detail: "number" },
	{ label: 'baseMaxChroma', type: 'property', info: "Max chroma for base colors. Default: 0.01", detail: "number" },
	{ label: 'foregroundMaxChroma', type: 'property', info: "Max chroma for foreground colors. Default: 0.01", detail: "number" },
	{ label: 'minContrastRatio', type: 'property', info: "Min WCAG contrast ratio. Default: 'AAA' (7)", detail: "'AAA' | 'AA' | number" },
	{ label: 'hueShift', type: 'property', info: "Hue shift per variant step (degrees). Default: 0", detail: "number" },
	{ label: 'invertDarkModeBaseAccent', type: 'property', info: "Swap base/accent hues in dark mode. Default: false", detail: "boolean" },
	{ label: 'light', type: 'property', info: "Per-theme adjustments for light mode", detail: "ThemeAdjustments", apply: "light: { lightness: 0.7 }" },
	{ label: 'dark', type: 'property', info: "Per-theme adjustments for dark mode", detail: "ThemeAdjustments", apply: "dark: { lightness: 0.6 }" },
	{ label: 'semanticColors', type: 'property', info: "Custom semantic colors (positive, negative, warning)", detail: "object", apply: "semanticColors: { positive: '#00ff00' }" },
	{ label: 'semanticColorRanges', type: 'property', info: "Hue degree ranges for semantic colors", detail: "object" },
];

const THEME_ADJUSTMENTS: CompletionEntry[] = [
	{ label: 'lightness', type: 'property', info: "Absolute OKLCH lightness (0–1). Light default: 0.7, dark default: 0.6", detail: "number" },
	{ label: 'maxChroma', type: 'property', info: "Max chroma for accent/semantic colors in this theme", detail: "number" },
	{ label: 'minContrastRatio', type: 'property', info: "Override global contrast ratio for this theme", detail: "'AAA' | 'AA' | number" },
	{ label: 'baseMaxChroma', type: 'property', info: "Override global baseMaxChroma for this theme", detail: "number" },
	{ label: 'foregroundMaxChroma', type: 'property', info: "Override global foregroundMaxChroma for this theme", detail: "number" },
];

const VARIANT_PLACEMENTS: CompletionEntry[] = [
	{ label: 'beyond', type: 'property', info: "Place variant beyond an edge ('strong' or 'weak')", detail: "'strong' | 'weak'" },
	{ label: 'between', type: 'property', info: "Place variant between two existing variants", detail: "[string, string]", apply: "between: ['DEFAULT', 'strong']" },
];

const PRESETS: CompletionEntry[] = [
	{ label: 'presets.shadcn', type: 'variable', info: "shadcn/ui-compatible preset" },
	{ label: 'presets.demo', type: 'variable', info: "Demo preset with extra roles and variants" },
];

function matchContext(text: string): CompletionEntry[] | null {
	// After a dot: builder methods
	if (/\.\s*[a-zA-Z]*$/.test(text)) return BUILDER_METHODS;

	// presets.
	if (/presets\.\s*[a-zA-Z]*$/.test(text)) return PRESETS;

	// Inside .light({ or .dark({ — theme adjustments
	if (/\.\s*(?:light|dark)\s*\(\s*\{[^}]*$/.test(text)) return THEME_ADJUSTMENTS;

	// Inside addVariant second arg
	if (/\.addVariant\s*\([^,]+,\s*\{[^}]*$/.test(text)) return VARIANT_PLACEMENTS;

	// Inside hextimate(..., { ... }) — generation options
	if (/hextimate\s*\([^)]*,\s*\{[^}]*$/.test(text)) return GENERATION_OPTIONS;

	return null;
}

export function hextimatorCompletions(context: CompletionContext): CompletionResult | null {
	const line = context.state.doc.lineAt(context.pos);
	const textBefore = line.text.slice(0, context.pos - line.from);

	// Find what we're currently typing
	const wordMatch = textBefore.match(/[\w.]*$/);
	if (!wordMatch) return null;
	const word = wordMatch[0];

	// Activate on trigger characters, typing, or explicit invocation (Ctrl+Space)
	const hasTrigger = textBefore.endsWith('.') || textBefore.endsWith('{') || /,\s*$/.test(textBefore);
	if (!word && !hasTrigger && !context.explicit) return null;

	// Gather all text up to cursor for multi-line context matching
	const fullText = context.state.doc.sliceString(0, context.pos).replace(/\n/g, ' ');

	// Try full text first (handles multi-line), fall back to current line
	let completions = matchContext(fullText);
	if (!completions) completions = matchContext(textBefore);
	if (!completions) return null;

	const from = context.pos - (word.startsWith('presets.') ? word.length : (word.split('.').pop()?.length ?? 0));

	return {
		from,
		options: completions.map((c) => ({
			label: c.label,
			type: c.type,
			info: c.info,
			detail: c.detail,
			apply: c.apply,
		})),
	};
}
