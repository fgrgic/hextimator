import { expect, test } from 'bun:test';
import { CompletionContext } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { hextimatorCompletions } from '../src/completions';

function labels(doc: string) {
	const state = EditorState.create({ doc });
	return hextimatorCompletions(
		new CompletionContext(state, doc.length, true),
	)?.options.map((option) => option.label);
}

test('offers style settings', () => {
	const options = labels("hextimate('#ff6600').style({ ");
	expect(options).toContain('minContrastRatio');
});

test('offers style settings after applying a preset', () => {
	expect(
		labels("hextimate('#ff6600').preset(presets.muted).style({ "),
	).toContain('minContrastRatio');
});

test('offers theme adjustments in both theme branches without global-only options', () => {
	for (const theme of ['light', 'dark']) {
		const options = labels(`hextimate('#ff6600').style({ ${theme}: { `);
		expect(options).toContain('minContrastRatio');
		expect(options).not.toContain('invertDarkModeSurfaceAccent');
	}
});

test('offers style settings in a theme definition', () => {
	expect(labels('hextimate(color, { ...baseTheme, style: { ')).toContain(
		'minContrastRatio',
	);
	expect(labels('hextimate(color, { style: { light: { ')).not.toContain(
		'invertDarkModeSurfaceAccent',
	);
});

test('offers built-in themes', () => {
	expect(labels('hextimate(color, themes.')).toContain('themes.shadcn');
});
