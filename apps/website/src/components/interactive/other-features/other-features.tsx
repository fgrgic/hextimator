import { ControlSlider, Flash, Palette } from 'iconoir-react';
import { CodeBrackets, GitFork, HalfMoon } from 'iconoir-react/regular';
import { BentoCard, BentoGrid } from '../../bento';
import { CodeSnippet } from '../../code-snippet';

function HueGradient() {
	return (
		<div
			className="w-full h-10 rounded-lg"
			style={{
				background:
					'linear-gradient(to right, oklch(0.8 0.15 0), oklch(0.8 0.15 60), oklch(0.8 0.15 120), oklch(0.8 0.15 180), oklch(0.8 0.15 240), oklch(0.8 0.15 300), oklch(0.8 0.15 360))',
			}}
		/>
	);
}

const COLOR_FORMATS_SNIPPET = `.format({
  as: 'json'
  colors: 'oklch'
  variants: {
    strong: 'secondary',
    weak: 'tertiary',
  }
})`;

export function OtherFeatures() {
	return (
		<BentoGrid className="md:-mx-2">
			<BentoCard
				span="wide"
				title="Perceptually uniform"
				description="Built on OKLCH. Once the theming preset is defined, any theme built on that preset will have consistent perceived contrast, no matter the hue!"
				visual={<HueGradient />}
			/>
			<BentoCard
				title="Runtime theming"
				description="Generate branded themes on the fly. Perfect for B2B2C apps with per-tenant branding."
				icon={<Flash />}
			/>
			<BentoCard
				title="Semantic scales"
				description="Positive, negative, and warning scales generated automatically from a single color."
				icon={<Palette />}
			/>
			<BentoCard
				title="Per-mode adjustments"
				description="Make global adjustments for both dark and light mode, or modify each mode individually."
				icon={<HalfMoon />}
			/>
			<BentoCard
				span="tall"
				title="Output what you need"
				icon={<CodeBrackets />}
				description={
					<div className="flex flex-col gap-2">
						<p className="font-light text-sm">
							Output theme format that you need, and remap default names to fit
							your app's theme.
						</p>
						<CodeSnippet code={COLOR_FORMATS_SNIPPET} />
					</div>
				}
			/>
			<BentoCard
				title="Fork themes"
				description="Create different versions of the theme — more accessible version, or a more muted one."
				icon={<GitFork />}
			></BentoCard>
			<BentoCard
				title="Build presets"
				description="Hextimator includes presets for popular tools such as shadcn. Build your own presets for tools you use."
				icon={<ControlSlider />}
			></BentoCard>
		</BentoGrid>
	);
}
