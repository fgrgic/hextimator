import { useHextimatorTheme } from 'hextimator/react';

function RangeSlider({
	label,
	value,
	min,
	max,
	step,
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
}) {
	const percent = ((value - min) / (max - min)) * 100;
	return (
		<label className="flex flex-col gap-1">
			<span className="text-xs">
				{label}: {value}
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
				onChange={(e) => onChange(Number(e.target.value))}
			/>
		</label>
	);
}

function Checkbox({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<label className="flex items-center gap-2 text-xs cursor-pointer">
			<input
				type="checkbox"
				className="accent-(--color-accent)"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
			/>
			{label}
		</label>
	);
}

function SegmentedControl({
	value,
	options,
	onChange,
}: {
	value: string;
	options: { label: string; value: string }[];
	onChange: (value: string) => void;
}) {
	return (
		<div className="flex rounded-lg bg-base p-0.5 text-xs">
			{options.map((opt) => (
				<button
					key={opt.value}
					type="button"
					className={`flex-1 rounded-md px-3 py-1 cursor-pointer transition-colors ${
						value === opt.value
							? 'bg-base-weak font-bold'
							: 'hover:bg-base-weak/50'
					}`}
					onClick={() => onChange(opt.value)}
				>
					{opt.label}
				</button>
			))}
		</div>
	);
}

export function ThemePreferences() {
	const { generation, setGeneration, mode, setMode } = useHextimatorTheme();
	const defaults = {
		light: { lightness: 0.7, maxChroma: 0.15 },
		dark: { lightness: 0.6, maxChroma: 0.15 },
	};
	const current = generation?.[mode];

	return (
		<div className="flex flex-col flex-1 bg-base-strong rounded-xl border border-(--color-base-weak) p-4 mt-4 md:mt-0 md:mx-12 text-base-foreground max-w-sm gap-3">
			<h3>Adjust theme</h3>

			<RangeSlider
				label="Base hue shift"
				value={generation?.baseHueShift ?? 0}
				min={0}
				max={360}
				step={10}
				onChange={(v) => setGeneration({ ...generation, baseHueShift: v })}
			/>

			<SegmentedControl
				value={mode}
				options={[
					{ label: 'Light', value: 'light' },
					{ label: 'Dark', value: 'dark' },
				]}
				onChange={(v) => setMode(v as 'light' | 'dark')}
			/>

			<RangeSlider
				label="Lightness"
				value={current?.lightness ?? defaults[mode].lightness}
				min={0}
				max={1}
				step={0.05}
				onChange={(v) =>
					setGeneration({
						...generation,
						[mode]: { ...current, lightness: v },
					})
				}
			/>
			<RangeSlider
				label="Max chroma"
				value={current?.maxChroma ?? defaults[mode].maxChroma}
				min={0}
				max={0.4}
				step={0.01}
				onChange={(v) =>
					setGeneration({
						...generation,
						[mode]: { ...current, maxChroma: v },
					})
				}
			/>

			{mode === 'dark' && (
				<Checkbox
					label="Invert base/accent in dark mode"
					checked={generation?.invertDarkModeBaseAccent ?? false}
					onChange={(v) =>
						setGeneration({ ...generation, invertDarkModeBaseAccent: v })
					}
				/>
			)}
		</div>
	);
}
