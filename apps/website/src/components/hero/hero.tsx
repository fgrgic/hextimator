import { parseColor } from 'hextimator';
import { useHextimatorTheme } from 'hextimator/react';
import { LongArrowRightDown, NavArrowRight, Star } from 'iconoir-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../button';
import { registerColorCyclerStop } from './color-cycler-signal';
import { ColorInput } from './color-input';
import { ColorPicker } from './color-picker';
import { PartnerDashboardMock } from './partner-dashboard-mock';
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

	const hintFadeStyle = {
		opacity: showHint ? 0.6 : 0,
		transition: 'opacity 300ms ease-in-out',
	} satisfies React.CSSProperties;

	return (
		<section className="relative mt-12 min-h-3/5 w-full pb-24 pt-6 text-surface-foreground md:mt-20 md:pb-32">
			<div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col items-center gap-10 px-6 lg:flex-row-reverse lg:items-center lg:justify-center lg:gap-x-16 lg:gap-y-12 lg:px-8">
				<div className="flex w-full min-w-0 flex-col items-center gap-3 text-center lg:max-w-xl lg:w-auto lg:shrink-0 lg:items-start lg:text-left">
					<h1 className="sr-only">
						Hextimator: one color in, branded theme out
					</h1>
					<div className="flex w-full min-w-0 flex-col items-center lg:items-start">
						<div className="relative mx-auto inline-flex max-w-full flex-row flex-wrap items-center justify-center gap-x-1 gap-y-1 self-center text-3xl leading-tight font-light max-lg:tracking-tight lg:mx-0 lg:justify-start lg:self-start lg:text-4xl lg:leading-normal lg:tracking-normal">
							<div
								className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 flex -translate-x-3/4 items-end gap-0.5 -rotate-3 whitespace-nowrap lg:hidden"
								style={hintFadeStyle}
								aria-hidden={!showHint}
							>
								<span className="text-xs italic text-surface-foreground">
									pick any hex color
								</span>
								<LongArrowRightDown className="size-4" strokeWidth={1} />
							</div>
							<span aria-hidden>One</span>
							<div className="relative inline-flex shrink-0">
								<div
									className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden -translate-x-10 items-start gap-0.5 -rotate-3 whitespace-nowrap lg:flex"
									style={hintFadeStyle}
									aria-hidden={!showHint}
								>
									<span className="text-xs italic text-surface-foreground">
										pick any hex color
									</span>
									<LongArrowRightDown className="size-4" strokeWidth={1} />
								</div>
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
							</div>
							<span aria-hidden>in.</span>
						</div>
						<div className="flex max-w-full flex-row flex-wrap justify-center gap-x-1 gap-y-0 text-3xl leading-tight font-light max-lg:tracking-tight lg:justify-start lg:text-4xl lg:leading-normal lg:tracking-normal">
							<span aria-hidden>Whole</span>
							<span aria-hidden>theme</span>
							<span aria-hidden>out.</span>
						</div>
					</div>
					<p className="mx-auto w-full max-w-xs text-sm font-light text-balance md:max-w-sm lg:mx-0 lg:max-w-sm lg:text-left">
						Swap the brand color, and every shade, scale, and contrast ratio
						regenerates itself.
					</p>
					<div className="mt-1 flex max-w-full flex-col items-center gap-3 lg:items-start">
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
				</div>

				<div className="-mx-2 flex min-w-0 w-[calc(100%+1rem)] justify-center lg:mx-0 lg:min-w-0 lg:w-full lg:flex-1 lg:justify-start">
					<PartnerDashboardMock accentColor={currentColor} />
				</div>
			</div>
		</section>
	);
}
