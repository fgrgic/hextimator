import { parseColor } from 'hextimator';
import { useHextimatorTheme } from 'hextimator/react';
import { LongArrowRightDown, NavArrowRight } from 'iconoir-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../button';
import { ColorInput } from './color-input';
import { useColorCycler } from './use-color-cycler';

function tryApplyColor(value: string, setColor: (c: string) => void) {
	try {
		const color = parseColor(value);
		if (color) {
			setColor(value);
		}
	} catch {
		// partial input, do nothing
	}
}

export function Hero() {
	const { color: currentColor, setColor } = useHextimatorTheme();
	const [initialColor] = useState(currentColor);
	const [input, setInput] = useState('');

	const applyValue = useCallback(
		(value: string, updateTheme = true) => {
			setInput(value);
			if (updateTheme) tryApplyColor(value, setColor);
		},
		[setColor],
	);

	const { stop } = useColorCycler(applyValue, initialColor);

	const [showHint, setShowHint] = useState(true);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		stop();
		setShowHint(false);
		applyValue(e.target.value);
	};

	return (
		<section className="relative mt-12 flex flex-col items-center text-center bg-base text-base-foreground min-h-3/5 p-6 gap-2">
			<div
				className="absolute -top-2 left-1/2 -translate-x-1/2 -ml-12 flex items-end gap-0.5 -rotate-3 pointer-events-none"
				style={{
					opacity: showHint ? 0.6 : 0,
					transition: 'opacity 500ms ease-in-out',
				}}
			>
				<span className="text-xs italic text-base-foreground whitespace-nowrap">
					type in any hex color
				</span>
				<LongArrowRightDown className="size-4" strokeWidth={1} />
			</div>
			<div className="flex flex-col items-center">
				<div className="flex flex-row gap-1 font-light text-3xl">
					<span className="sr-only">One color in.</span>
					<span aria-hidden>One</span>
					<ColorInput color={input} onColorChange={handleInputChange} />
					<span aria-hidden>in.</span>
				</div>
				<div className="flex flex-row gap-1 font-light text-3xl">
					<span className="sr-only">Whole theme out.</span>
					<span aria-hidden>Whole</span>
					<span aria-hidden>theme</span>
					<span aria-hidden>out.</span>
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
