import { CodeBrackets, CubeReplaceFace, Flash, Palette } from 'iconoir-react';
import { BentoCard, BentoGrid } from '../../bento';

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

export function OtherFeatures() {
	return (
		<BentoGrid>
			<BentoCard
				span="wide"
				title="Perceptually uniform"
				description="Built on OKLCH. Once the theming preset is defined, any theme built on that preset will have consistent perceived contrast, no matter the hue!"
				visual={<HueGradient />}
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
	);
}
