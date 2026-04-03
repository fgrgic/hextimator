import './App.css';

import {
	Accessibility,
	AIReady,
	CodeEditor,
	Hero,
	NavBar,
	OtherFeatures,
	Section,
	ThemePreferences,
} from './components';
import { ThemePreview } from './components/theme-preview';

function App() {
	return (
		<div>
			<NavBar />
			<main className="flex flex-col items-center gap-16 md:gap-0 mt-12 mb-24">
				<Hero />
				<div className="flex flex-col items-stretch md:gap-8" id="features">
					<div className="flex w-full justify-center mt-14">
						<ThemePreview />
					</div>
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
						title="And much more..."
						description="Built from ground up for runtime theming"
						stacked
					>
						<OtherFeatures />
					</Section>
					<Section
						title="Try it out"
						description="Play around with the code to see how the output changes, and use it as a base for your projects!"
						stacked
						id="playground"
					>
						<CodeEditor />
					</Section>
				</div>
			</main>
		</div>
	);
}

export default App;
