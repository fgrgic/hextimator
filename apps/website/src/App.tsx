import './App.css';

import {
  Accessibility,
  AIReady,
  CodeEditor,
  Footer,
  Hero,
  NavBar,
  OtherFeatures,
  Section,
  ThemePreferences,
} from './components';
import { GetStarted } from './components/interactive/get-started';
import { ThemeColorMeta } from './components/theme-color-meta';
import { ThemePreview } from './components/theme-preview';

function App() {
  return (
    <div>
      <ThemeColorMeta />
      <NavBar />
      <main className="flex flex-col items-center md:gap-0 mt-12 mb-24">
        <Hero />
        <div
          className="flex flex-col items-stretch gap-8 md:gap-16"
          id="features"
        >
          <div className="flex w-full justify-center mt-20 mb-14 px-4">
            <ThemePreview />
          </div>
          <Section
            title="Build the rules"
            description="Configure lightness, chroma, and hue shifts for your palette. Once saved as a preset, any brand color produces a full theme with these same rules"
            id="theme-preferences"
          >
            <ThemePreferences />
          </Section>
          <Section
            title="AI ready"
            description="Generate themes from the CLI: one command, one color, full output. Ships with llms.txt so AI agents can use it without docs."
            reversed
          >
            <AIReady />
          </Section>
          <Section
            title="Accessibility built-in"
            description="Every generated foreground meets your minimum contrast ratio against its background. Adapt palettes for color vision deficiencies in one call."
          >
            <Accessibility />
          </Section>
          <Section
            title="Built for runtime theming"
            description="Everything you need to go from one brand color to a production-ready theme at build time or on every request."
            stacked
          >
            <OtherFeatures />
          </Section>
          <Section
            title="Try it out"
            description="Edit the code below and watch the theme update live. Copy the snippet to start your own preset."
            stacked
            id="playground"
          >
            <CodeEditor />
          </Section>
          <Section
            title="Get started"
            description="Add hextimator to your project and start building your theme."
          >
            <GetStarted />
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
