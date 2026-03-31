import { useHextimatorTheme } from 'hextimator/react';
import { useRef } from 'react';
import { stopColorCycler } from '../../hero/color-cycler-signal';
import { InteractiveCard } from '../interactive-card';

function RangeSlider({
	label,
	value,
	min,
	max,
	step,
	onChange,
	onInteract,
	unit,
	alwaysShowSign = false,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
	onInteract?: () => void;
	unit?: string;
	alwaysShowSign?: boolean;
}) {
	const percent = ((value - min) / (max - min)) * 100;
	return (
		<label className="flex flex-col gap-1">
			<span className="text-xs">
				{label}: {alwaysShowSign && value >= 0 ? '+' : ''}
				{value}
				{unit}
			</span>
			<input
				className="w-full appearance-none h-1.5
				  rounded-full cursor-pointer
				  accent-(--color-accent)"
				style={{
					background: `linear-gradient(to right, var(--color-base-weak) ${percent}%, var(--color-base) ${percent}%)`,
				}}
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onPointerDown={onInteract}
				onChange={(e) => onChange(Number(e.target.value))}
			/>
		</label>
	);
}

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
		<InteractiveCard className="gap-4">
			<h3>Adjust theme</h3>

			<RangeSlider
				label="Lightness"
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
				value={generation?.baseMaxChroma ?? 0.01}
				min={0}
				max={0.15}
				step={0.01}
				onInteract={handleInteract}
				onChange={(v) => setGeneration({ ...generation, baseMaxChroma: v })}
			/>
		</InteractiveCard>
	);
}
