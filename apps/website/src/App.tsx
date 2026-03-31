import './App.css';
import {
	Accessibility,
	Hero,
	NavBar,
	Section,
	ThemePreferences,
} from './components';

function App() {
	return (
		<div>
			<NavBar />
			<main>
				<Hero />
				<Section
					title="Build your own preset"
					description="Tweak how to generate the rest of the colors, and see the theme update on runtime."
					id="theme-preferences"
				>
					<ThemePreferences />
				</Section>
				{/*<Section
					title="Make dark/light mode adjustments"
					description="Adjust specifics on how the light and dark themes are generated, like lightness or chroma, to make them fit your design better."
					reversed
				>
				</Section>*/}
				<Section
					title="Built in accessibility"
					description="Guaranteed contrast ratios between all backgrounds and foregrounds, and color blindness adjustments to make sure your theme is inclusive and accessible to everyone."
					reversed
				>
					<Accessibility />
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
