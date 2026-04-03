import './App.css';
import {
	CodeBrackets,
	ColorFilter,
	CubeReplaceFace,
	Flash,
	Palette,
} from 'iconoir-react';
import {
	Accessibility,
	BentoCard,
	BentoGrid,
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
			<main className="flex flex-col items-center gap-16 md:gap-0 mt-12 mb-24">
				<Hero />
				<div className="flex flex-col items-stretch md:gap-16" id="features">
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
						<BentoGrid>
							<BentoCard
								span="wide"
								title="Perceptually uniform"
								description="Built on OKLCH — every palette has consistent perceived contrast, no matter the input hue."
								icon={<ColorFilter className="w-5 h-5" />}
							/>
							<BentoCard
								title="Runtime theming"
								description="Generate branded themes on the fly. Perfect for B2B2C apps with per-tenant branding."
								icon={<Flash className="w-5 h-5" />}
							/>
							<BentoCard
								title="Any format"
								description="CSS custom properties, Tailwind, SCSS, JSON, or plain objects — output what you need."
								icon={<CodeBrackets className="w-5 h-5" />}
							/>
							<BentoCard
								title="Semantic scales"
								description="Positive, negative, and warning scales generated automatically from a single color."
								icon={<Palette className="w-5 h-5" />}
							/>
							<BentoCard
								title="Framework agnostic"
								description="Works anywhere JavaScript runs. First-class React hook included, with dark mode support out of the box."
								icon={<CubeReplaceFace className="w-5 h-5" />}
							/>
						</BentoGrid>
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
