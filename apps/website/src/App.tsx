import './App.css';
import {
	Accessibility,
	CodeEditor,
	Hero,
	NavBar,
	Section,
	ThemePreferences,
} from './components';
import { AIReady } from './components/interactive/ai-ready';

function App() {
	return (
		<div>
			<NavBar />
			<main className="flex flex-col">
				<Hero />
				<div className="flex flex-col gap-16 self-center">
					<Section
						title="Build your own preset"
						description="Tweak how to generate the rest of the colors, and see the theme update on runtime."
						id="theme-preferences"
					>
						<ThemePreferences />
					</Section>
					<Section
						title="AI ready"
						description="Agents can use the CLI to generate themes. Hextimator also includes an llms.txt out of the box."
						reversed
					>
						<AIReady />
					</Section>
					<Section
						title="Accessibility built-in"
						description="Guaranteed contrast ratios between all backgrounds and foregrounds, and color blindness adjustments to make sure your theme is inclusive and accessible to everyone."
					>
						<Accessibility />
					</Section>
					<Section
						title="Try it out"
						description="Play around with the code to see how the output changes, and use it as a base for your projects!"
						stacked
					>
						<CodeEditor />
					</Section>
				</div>
			</main>
		</div>
	);
}

export default App;
