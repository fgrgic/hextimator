import { parseColor } from 'hextimator';
import { useHextimatorTheme } from 'hextimator/react';
import { NavArrowRight } from 'iconoir-react';
import { useState } from 'react';
import { Button } from '../button';
import { ColorInput } from '../color-input';

export function Hero() {
	const [input, setInput] = useState('ff6677');
	const { setColor } = useHextimatorTheme();

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInput(e.target.value);
		const color = parseColor(e.target.value);

		if (!color) return null;

		setColor(e.target.value);
	};

	return (
		<section className="mt-12 flex flex-col items-center text-center bg-base text-base-foreground min-h-3/5 p-6 gap-2">
			<div className="flex flex-col items-center">
				<div className="flex flex-row gap-1 font-light text-3xl">
					<span>One</span>
					<ColorInput color={input} onColorChange={handleInputChange} />
					<span>in.</span>
				</div>
				<div className="flex flex-row gap-1 font-light text-3xl">
					<span>Whole</span>
					<span>theme</span>
					<span>out.</span>
				</div>
			</div>
			<p className="text-sm font-light max-w-xs">
				Generate complete light and dark themes at runtime with accessibility
				guarantees.
			</p>
			<div className="flex flex-col gap-2 mt-4">
				<Button icon={NavArrowRight}>Get started</Button>
				<Button
					variant="ghost"
					href="https://github.com/fgrgic/hextimator"
					target="_blank"
					rel="noopener noreferrer"
				>
					Star us on GitHub
				</Button>
			</div>
		</section>
	);
}
