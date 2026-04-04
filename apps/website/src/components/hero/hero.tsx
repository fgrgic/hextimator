import { parseColor } from 'hextimator';
import { useHextimatorTheme } from 'hextimator/react';
import { LongArrowRightDown, NavArrowRight, Star } from 'iconoir-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../button';
import { registerColorCyclerStop } from './color-cycler-signal';
import { ColorInput } from './color-input';
import { ColorPicker } from './color-picker';
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
	const [pickerOpen, setPickerOpen] = useState(false);

	const themeTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
	const applyValue = useCallback(
		(value: string, updateTheme = true) => {
			setInput(value);
			if (updateTheme) {
				clearTimeout(themeTimeout.current);
				themeTimeout.current = setTimeout(
					() => tryApplyColor(value, setColor),
					30,
				);
			}
		},
		[setColor],
	);

	const { isActive, stop, restart, stopAfterCurrent } = useColorCycler(
		applyValue,
		initialColor,
	);

	useEffect(() => {
		registerColorCyclerStop(stopAfterCurrent);
	}, [stopAfterCurrent]);

	const [showHint, setShowHint] = useState(true);

	const handleClick = () => {
		stop();
		setPickerOpen(true);
	};

	const handleFocus = () => {
		// Only open picker on focus if cycler is already stopped
		// (prevents Safari's spurious focus events during value updates)
		if (isActive) return;
		setPickerOpen(true);
	};

	const handleGetStarted = () => {
		stop();
		setPickerOpen(true);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		applyValue(e.target.value);
		setShowHint(false);
	};

	const handlePickerSelect = useCallback(
		(hex: string) => {
			applyValue(hex);
			setShowHint(false);
		},
		[applyValue],
	);

	const handleResume = () => {
		setPickerOpen(false);
		setShowHint(true);
		restart(input);
	};

	return (
		<section className="relative mt-12 md:mt-20 flex flex-col items-center text-center text-base-foreground min-h-3/5 pt-6 px-6 gap-2 ">
			<div
				className="absolute -top-1 left-1/2 -translate-x-1/2 -ml-12 flex items-end gap-0.5 -rotate-3 pointer-events-none"
				style={{
					opacity: showHint ? 0.6 : 0,
					transition: 'opacity 300ms ease-in-out',
				}}
			>
				<span className="text-xs italic text-base-foreground whitespace-nowrap">
					pick any hex color
				</span>
				<LongArrowRightDown className="size-4" strokeWidth={1} />
			</div>
			<h1 className="sr-only">One color in. Whole theme out</h1>
			<div className="flex flex-col items-center">
				<div className="flex flex-row gap-1 font-light text-4xl">
					<span aria-hidden>One</span>
					<ColorPicker
						open={pickerOpen}
						onOpenChange={setPickerOpen}
						color={input}
						onColorSelect={handlePickerSelect}
						showResume={!isActive}
						onResume={handleResume}
					>
						<ColorInput
							color={input}
							onColorChange={handleInputChange}
							onFocus={handleFocus}
							onClick={handleClick}
							cycling={isActive}
						/>
					</ColorPicker>
					<span aria-hidden>in.</span>
				</div>
				<div className="flex flex-row gap-1 font-light text-4xl">
					<span aria-hidden>Whole</span>
					<span aria-hidden>theme</span>
					<span aria-hidden>out.</span>
				</div>
			</div>
			<p className="text-sm font-light max-w-xs">
				Generate complete light and dark themes at runtime with accessibility
				guarantees.
			</p>
			<div className="flex flex-col gap-3 mt-4">
				<Button icon={NavArrowRight} onClick={handleGetStarted}>
					Get started
				</Button>
				<Button
					variant="ghost"
					href="https://github.com/fgrgic/hextimator"
					target="_blank"
					rel="noopener noreferrer"
					icon={Star}
				>
					Star it on GitHub
				</Button>
			</div>
		</section>
	);
}
