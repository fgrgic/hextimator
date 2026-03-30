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
			</main>
		</div>
	);
}

export default App;
