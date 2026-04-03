import { CodeEditor as PlaygroundEditor } from '@hextimator/playground';
import '@hextimator/playground/style.css';
import { useHextimatorTheme } from 'hextimator/react';

const DEFAULT_CODE = `hextimate(color)
  // .preset(presets.shadcn)
  // .addRole('cta', '#ff006e')
  // .addVariant('muted', { beyond: 'weak' })
  // .addToken('ring', { from: 'accent' })
  `;

export function CodeEditor() {
	const { color } = useHextimatorTheme();

	return (
		<PlaygroundEditor
			defaultCode={DEFAULT_CODE}
			color={color}
			className="overflow-hidden bg-base-strong border border-base-weak"
			outputClassName="max-h-75 md:max-h-80"
		/>
	);
}
