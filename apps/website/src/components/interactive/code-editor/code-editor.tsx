import { CodeEditor as PlaygroundEditor } from '@hextimator/playground';
import '@hextimator/playground/style.css';
import { useHextimatorTheme } from 'hextimator/react';

const DEFAULT_CODE = `hextimate(color)
  // .style({ minContrastRatio: 'AA' })
  // .preset(presets.shadcn)
  // .addRole('cta', '#ff006e')
  // .addVariant('muted', { from: 'weak' })
  // .addToken('ring', { from: 'accent', emphasis: -0.2 })
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
