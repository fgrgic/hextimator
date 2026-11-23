import type {
	CompletionContext,
	CompletionResult,
} from '@codemirror/autocomplete';

type CompletionEntry = {
	label: string;
	type: string;
	info?: string;
	detail?: string;
	apply?: string;
};

const BUILDER_METHODS: CompletionEntry[] = [
	{
		label: 'simulate',
		type: 'method',
		detail: '(type, severity?)',
		info: 'Preview CVD simulation (deuteranopia, protanopia, tritanopia, achromatopsia)',
		apply: "simulate('deuteranopia')",
	},
	{
		label: 'adaptFor',
		type: 'method',
		detail: '(type, severity?)',
		info: 'Adapt palette for color vision deficiency',
		apply: "adaptFor('deuteranopia')",
	},
	{
		label: 'fork',
		type: 'method',
		detail: '(color?)',
		info: 'Clone builder, optionally with a new accent',
		apply: "fork('#color')",
	},
	{
		label: 'format',
		type: 'method',
		detail: '(options)',
		info: 'Format the palette for output',
		apply: "format({ as: 'css', colors: 'hex' })",
	},
];

const STYLE_OPTIONS: CompletionEntry[] = [
	{
		label: 'surfaceColor',
		type: 'property',
		info: 'Surface color for the theme. Takes precedence over surfaceHueShift',
		detail: 'ColorInput',
	},
	{
		label: 'surfaceHueShift',
		type: 'property',
		info: 'Rotate surface hue relative to accent (degrees). Default: 0',
		detail: 'number',
	},
	{
		label: 'surfaceMaxChroma',
		type: 'property',
		info: 'Max chroma for surface colors. Default: 0.01',
		detail: 'number',
	},
	{
		label: 'foregroundMaxChroma',
		type: 'property',
		info: 'Max chroma for foreground colors. Default: 0.01',
		detail: 'number',
	},
	{
		label: 'minContrastRatio',
		type: 'property',
		info: "Min WCAG contrast ratio. Default: 'AAA' (7)",
		detail: "'AAA' | 'AA' | number",
	},
	{
		label: 'hueShift',
		type: 'property',
		info: 'Hue shift per variant step (degrees). Default: 0',
		detail: 'number',
	},
	{
		label: 'invertDarkModeSurfaceAccent',
		type: 'property',
		info: 'Swap surface/accent hues in dark mode. Default: false',
		detail: 'boolean',
	},
	{
		label: 'light',
		type: 'property',
		info: 'Per-theme adjustments for light mode',
		detail: 'ThemeAdjustments',
		apply: 'light: { baseLightness: 0.65 }',
	},
	{
		label: 'dark',
		type: 'property',
		info: 'Per-theme adjustments for dark mode',
		detail: 'ThemeAdjustments',
		apply: 'dark: { baseLightness: 0.55 }',
	},
	{
		label: 'semanticColors',
		type: 'property',
		info: 'Custom semantic colors (positive, negative, caution)',
		detail: 'object',
		apply: "semanticColors: { positive: '#00ff00' }",
	},
	{
		label: 'semanticColorRanges',
		type: 'property',
		info: 'Hue degree ranges for semantic colors',
		detail: 'object',
	},
];

const THEME_ADJUSTMENTS: CompletionEntry[] = [
	{
		label: 'baseLightness',
		type: 'property',
		info: 'Absolute OKLCH lightness anchor for the accent (0–1). When omitted, both themes use the input color OKLCH L (clamped per theme).',
		detail: 'number',
	},
	{
		label: 'maxChroma',
		type: 'property',
		info: 'Max chroma for accent/semantic colors in this theme',
		detail: 'number',
	},
	{
		label: 'minContrastRatio',
		type: 'property',
		info: 'Override global contrast ratio for this theme',
		detail: "'AAA' | 'AA' | number",
	},
	{
		label: 'surfaceMaxChroma',
		type: 'property',
		info: 'Override global surfaceMaxChroma for this theme',
		detail: 'number',
	},
	{
		label: 'foregroundMaxChroma',
		type: 'property',
		info: 'Override global foregroundMaxChroma for this theme',
		detail: 'number',
	},
];

const VARIANT_PLACEMENTS: CompletionEntry[] = [
	{
		label: 'from',
		type: 'property',
		info: "Derive from an existing variant ('strong', 'weak', 'foreground', 'foreground-weak', etc.)",
		detail: "'strong' | 'weak' | 'foreground' | 'foreground-weak'",
	},
	{
		label: 'between',
		type: 'property',
		info: 'Place variant between two existing variants',
		detail: '[string, string]',
		apply: "between: ['DEFAULT', 'strong']",
	},
];

const THEMES: CompletionEntry[] = [
	{ label: 'themes.shadcn', type: 'variable', info: 'shadcn/ui theme' },
	{ label: 'themes.mui', type: 'variable', info: 'MUI theme' },
	{ label: 'themes.muted', type: 'variable', info: 'Desaturated style theme' },
	{
		label: 'themes.vibrant',
		type: 'variable',
		info: 'High-chroma style theme',
	},
	{ label: 'themes.tinted', type: 'variable', info: 'Accent-tinted neutrals' },
	{
		label: 'themes.bold',
		type: 'variable',
		info: 'Strong-contrast style theme',
	},
];

function matchContext(text: string): CompletionEntry[] | null {
	if (/\bthemes\.\s*[a-zA-Z]*$/.test(text)) return THEMES;

	// After a dot: builder methods
	if (/\.\s*[a-zA-Z]*$/.test(text)) return BUILDER_METHODS;

	// Theme adjustments inside style branches.
	if (/\bstyle\s*[(:][\s\S]*\b(?:light|dark)\s*:\s*\{[^}]*$/.test(text))
		return THEME_ADJUSTMENTS;

	if (
		/\bplacement\s*:\s*\{[^}]*$/.test(text) ||
		/\.addVariant\s*\([^,]+,\s*\{[^}]*$/.test(text)
	)
		return VARIANT_PLACEMENTS;

	// Style options in a theme's `style` field or `.style({ ... })`
	if (/\bstyle\s*[(:]\s*\{[^}]*$/.test(text)) return STYLE_OPTIONS;

	return null;
}

export function hextimatorCompletions(
	context: CompletionContext,
): CompletionResult | null {
	const line = context.state.doc.lineAt(context.pos);
	const textBefore = line.text.slice(0, context.pos - line.from);

	// Find what we're currently typing
	const wordMatch = textBefore.match(/[\w.]*$/);
	if (!wordMatch) return null;
	const word = wordMatch[0];

	// Activate on trigger characters, typing, or explicit invocation (Ctrl+Space)
	const hasTrigger =
		textBefore.endsWith('.') ||
		textBefore.endsWith('{') ||
		/,\s*$/.test(textBefore);
	if (!word && !hasTrigger && !context.explicit) return null;

	// Gather all text up to cursor for multi-line context matching
	const fullText = context.state.doc
		.sliceString(0, context.pos)
		.replace(/\n/g, ' ');

	// Try full text first (handles multi-line), fall back to current line
	let completions = matchContext(fullText);
	if (!completions) completions = matchContext(textBefore);
	if (!completions) return null;

	const from =
		context.pos -
		(word.startsWith('themes.')
			? word.length
			: (word.split('.').pop()?.length ?? 0));

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
