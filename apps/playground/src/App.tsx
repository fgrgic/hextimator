import { CodeEditor } from '@hextimator/playground';
import '@hextimator/playground/style.css';
import { HextimatorLogo } from './hextimator-logo';
import './App.css';

function getColorFromURL(): string {
	const path = window.location.pathname.replace(/^\//, '');
	if (/^[0-9a-fA-F]{3,8}$/.test(path)) return `#${path}`;
	return '#3a86ff';
}

const INITIAL_COLOR = getColorFromURL();

const DEFAULT_CODE = `hextimate('${INITIAL_COLOR}')
  // .preset(presets.shadcn)
  // .addRole('cta', '#ff006e')
  // .addVariant('muted', { beyond: 'weak' })
  // .addToken('ring', { from: 'accent' })
  `;

function App() {
	return (
		<div className="app">
			<div className="top-bar">
				<HextimatorLogo scale={0.6} />
			</div>
			<CodeEditor
				defaultCode={DEFAULT_CODE}
				color={INITIAL_COLOR}
			/>
		</div>
	);
}

export default App;
