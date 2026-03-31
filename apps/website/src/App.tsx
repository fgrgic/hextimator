import './App.css';
import { Hero, NavBar, Section, ThemePreferences } from './components';

function App() {
	return (
		<div>
			<NavBar />
			<main>
				<Hero />
				<Section
					title="Build your own preset"
					description="Tweak how to generate the rest of the colors, and see the theme update on runtime."
				>
					<ThemePreferences />
				</Section>
				<Section
					title="Make dark/light mode adjustments"
					description="Adjust specifics on how the light and dark themes are generated, like lightness or chroma, to make them fit your design better."
					reversed
				>
					{/* TODO */}
				</Section>
				<Section
					title="Guaranteed contrast ratio"
					description="By default every foreground has a AAA contrast ratio to its background color"
				>
					{/* TODO */}
				</Section>
				<Section
					title="Color blindness support"
					description="Export variants of your theme with adjusted colors to be more distinguishable for different types of color blindness."
					reversed
				>
					{/* TODO */}
				</Section>
				<Section
					title="AI ready"
					description="embedded cli tool to generate themes outside of the browser"
				>
					{/* TODO */}
				</Section>
				<Section
					title="Try it out"
					description="This is the theme you generated so far. Play around with the code to see how the output changes, and use it as a base for your projects!"
					reversed
				>
					{/* TODO */}
				</Section>
			</main>
		</div>
	);
}

export default App;
