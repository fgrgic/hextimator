import { useHextimatorTheme } from 'hextimator/react';
import { RefreshDouble, Shuffle } from 'iconoir-react';
import { useRef } from 'react';
import { Button } from '../../button';
import { stopColorCycler } from '../../hero/color-cycler-signal';
import { RangeSlider } from '../../slider';
import { InteractiveCard } from '../interactive-card';

const DEFAULT_LIGHT_LIGHTNESS = 0.7;
const DEFAULT_DARK_LIGHTNESS = 0.6;

function getLightnessOffset(
	generation: ReturnType<typeof useHextimatorTheme>['generation'],
): number {
	const lightDelta =
		(generation?.light?.lightness ?? DEFAULT_LIGHT_LIGHTNESS) -
		DEFAULT_LIGHT_LIGHTNESS;
	const darkDelta =
		(generation?.dark?.lightness ?? DEFAULT_DARK_LIGHTNESS) -
		DEFAULT_DARK_LIGHTNESS;
	return Math.round(((lightDelta + darkDelta) / 2) * 100) / 100;
}

export function ThemePreferences() {
	const { generation, setGeneration } = useHextimatorTheme();
	const lightnessOffset = getLightnessOffset(generation);
	const hasStopped = useRef(false);

	const handleInteract = () => {
		if (!hasStopped.current) {
			stopColorCycler();
			hasStopped.current = true;
		}
	};

	return (
		<InteractiveCard>
			<h3>Adjust theme</h3>

			<RangeSlider
				label="Lightness"
				aria-label="Overall lightness adjustment for both light and dark themes"
				value={lightnessOffset}
				min={-0.2}
				max={0.2}
				step={0.05}
				alwaysShowSign
				onInteract={handleInteract}
				onChange={(v) =>
					setGeneration({
						...generation,
						light: {
							...generation?.light,
							lightness: DEFAULT_LIGHT_LIGHTNESS + v,
						},
						dark: {
							...generation?.dark,
							lightness: DEFAULT_DARK_LIGHTNESS + v,
						},
					})
				}
			/>

			<RangeSlider
				label="Background hue shift"
				aria-label="Hue shift applied to the background colors of both light and dark themes"
				value={generation?.baseHueShift ?? 0}
				min={0}
				max={360}
				step={10}
				unit="°"
				onInteract={handleInteract}
				onChange={(v) => setGeneration({ ...generation, baseHueShift: v })}
			/>

			<RangeSlider
				label="Background max chroma"
				aria-label="Maximum chroma allowed for background colors in both light and dark themes"
				value={generation?.baseMaxChroma ?? 0.01}
				min={0}
				max={0.1}
				step={0.005}
				onInteract={handleInteract}
				onChange={(v) => setGeneration({ ...generation, baseMaxChroma: v })}
			/>

			<Button
				icon={Shuffle}
				onClick={() => {
					handleInteract();
					const lightness = Math.round((Math.random() * 0.4 - 0.2) * 20) / 20;
					const hueShift = Math.round(Math.random() * 36) * 10;
					const chroma = Math.round(Math.random() * 15) / 100;
					setGeneration({
						...generation,
						light: {
							...generation?.light,
							lightness: DEFAULT_LIGHT_LIGHTNESS + lightness,
						},
						dark: {
							...generation?.dark,
							lightness: DEFAULT_DARK_LIGHTNESS + lightness,
						},
						baseHueShift: hueShift,
						baseMaxChroma: chroma,
					});
				}}
			>
				Randomize
			</Button>
			<Button
				variant="ghost"
				icon={RefreshDouble}
				onClick={() => {
					handleInteract();
					setGeneration({
						...generation,
						light: {
							...generation?.light,
							lightness: DEFAULT_LIGHT_LIGHTNESS,
						},
						dark: {
							...generation?.dark,
							lightness: DEFAULT_DARK_LIGHTNESS,
						},
						baseHueShift: 0,
						baseMaxChroma: 0.01,
					});
				}}
			>
				Reset to defaults
			</Button>
		</InteractiveCard>
	);
}
