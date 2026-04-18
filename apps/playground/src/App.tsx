import { CodeEditor } from '@hextimator/playground';
import '@hextimator/playground/style.css';
import { HextimatorProvider, useHextimatorTheme } from 'hextimator/react';
import { useMemo } from 'react';
import { HextimatorLogo } from './hextimator-logo';
import {
	activeGenerationPresetId,
	buildPlaygroundCode,
	PresetShowcase,
} from './preset-showcase';
import './App.css';

function getColorFromURL(): string {
	const path = window.location.pathname.replace(/^\//, '');
	if (/^[0-9a-fA-F]{3,8}$/.test(path)) return `#${path}`;
	return '#3a86ff';
}

const INITIAL_COLOR = getColorFromURL();

function PlaygroundShell() {
	const { color, presets: activePresets } = useHextimatorTheme();
	const presetId = useMemo(
		() => activeGenerationPresetId(activePresets),
		[activePresets],
	);
	const editorCode = useMemo(
		() => buildPlaygroundCode(color, presetId),
		[color, presetId],
	);

	return (
		<div className="app">
			<div className="top-bar">
				<HextimatorLogo scale={0.6} />
			</div>
			<div className="flex min-h-0 flex-1 flex-col gap-5 md:flex-row">
				<PresetShowcase className="w-full shrink-0 md:h-full md:w-60 md:overflow-y-auto" />
				<CodeEditor
					key={`${presetId}::${color}`}
					className="min-h-0 min-w-0 flex-1"
					defaultCode={editorCode}
					color={color}
				/>
			</div>
		</div>
	);
}

export default function App() {
	return (
		<HextimatorProvider
			defaultColor={INITIAL_COLOR}
			darkMode={{ type: 'media-or-class' }}
		>
			<PlaygroundShell />
		</HextimatorProvider>
	);
}
