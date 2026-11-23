import { CodeEditor as PlaygroundEditor } from '@hextimator/playground';
import '@hextimator/playground/style.css';
import { useHextimatorTheme } from 'hextimator/react';

const DEFAULT_CODE = `hextimate(color, {
  ...baseTheme,
  // style: { minContrastRatio: 'AA' },
  // roles: { ...baseTheme.roles, cta: { color: '#ff006e' } },
  // variants: [{ name: 'muted', placement: { from: 'weak' } }],
  // tokens: [...baseTheme.tokens, { name: 'ring', value: { from: 'accent' } }],
})
`;

export function CodeEditor() {
	const { color } = useHextimatorTheme();

	return (
		<PlaygroundEditor
			defaultCode={DEFAULT_CODE}
			color={color}
			className="bg-surface-strong border border-surface-weak"
			outputClassName="max-h-75 md:max-h-80"
			fontSize={20}
		/>
	);
}
