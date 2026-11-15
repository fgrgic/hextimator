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

test('offers property-aware and placeholder settings in style options', () => {
	const options = labels("hextimate('#ff6600').style({ ");
	expect(options).toContain('propertyAware');
	expect(options).toContain('placeholderContrastRatio');
});

test('offers style settings after applying a preset', () => {
	expect(
		labels("hextimate('#ff6600').preset(presets.muted).style({ "),
	).toContain('placeholderContrastRatio');
});

test('offers placeholder contrast in both theme branches without the global flag', () => {
	for (const theme of ['light', 'dark']) {
		const options = labels(`hextimate('#ff6600').style({ ${theme}: { `);
		expect(options).toContain('placeholderContrastRatio');
		expect(options).not.toContain('propertyAware');
	}
});
