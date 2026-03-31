import type { CVDType } from 'hextimator';
import { useHextimatorTheme } from 'hextimator/react';
import { NavArrowDown, RefreshDouble } from 'iconoir-react';
import { Select } from 'radix-ui';
import { useCallback, useRef, useState } from 'react';
import { Button } from '../../button';
import { stopColorCycler } from '../../hero/color-cycler-signal';
import { RangeSlider } from '../../slider';
import { InteractiveCard } from '../interactive-card';

const CVD_OPTIONS: { value: CVDType; label: string }[] = [
	{ value: 'deuteranopia', label: 'Deuteranopia (green-blind)' },
	{ value: 'protanopia', label: 'Protanopia (red-blind)' },
	{ value: 'tritanopia', label: 'Tritanopia (blue-yellow)' },
	{ value: 'achromatopsia', label: 'Achromatopsia (monochromacy)' },
];

function contrastBadge(ratio: number): { label: string; className: string } {
	if (ratio >= 7)
		return {
			label: 'AAA',
			className: 'bg-positive text-positive-foreground',
		};
	if (ratio >= 4.5)
		return {
			label: 'AA',
			className: 'bg-warning text-warning-foreground',
		};
	return {
		label: 'No Guarantee',
		className: 'bg-transparent text-negative-foreground',
	};
}

export function Accessibility() {
	const { generation, setGeneration, setConfigure } = useHextimatorTheme();

	const [contrastRatio, setContrastRatio] = useState(7);
	const [cvdType, setCvdType] = useState<CVDType | 'none'>('none');
	const [simulatePreview, setSimulatePreview] = useState(false);

	const hasStopped = useRef(false);

	const handleInteract = () => {
		if (!hasStopped.current) {
			stopColorCycler();
			hasStopped.current = true;
		}
	};

	const applyAccessibility = useCallback(
		(ratio: number, cvd: CVDType | 'none', simulate: boolean) => {
			setGeneration({
				...generation,
				minContrastRatio: ratio,
			});

			if (cvd === 'none') {
				setConfigure(undefined);
			} else {
				setConfigure((builder) => {
					builder.adaptFor(cvd);
					if (simulate) {
						builder.simulate(cvd);
					}
				});
			}
		},
		[generation, setGeneration, setConfigure],
	);

	const handleContrastChange = (value: number) => {
		handleInteract();
		setContrastRatio(value);
		applyAccessibility(value, cvdType, simulatePreview);
	};

	const handleCvdChange = (type: CVDType | 'none') => {
		handleInteract();
		setCvdType(type);
		const newSimulate = type === 'none' ? false : simulatePreview;
		if (type === 'none') setSimulatePreview(false);
		applyAccessibility(contrastRatio, type, newSimulate);
	};

	const handleReset = () => {
		handleInteract();
		setContrastRatio(7);
		setCvdType('none');
		setSimulatePreview(false);
		setGeneration({
			...generation,
			minContrastRatio: 7,
		});
		setConfigure(undefined);
	};

	return (
		<InteractiveCard>
			<h3>Accessibility</h3>

			<RangeSlider
				label="Min contrast"
				value={contrastRatio}
				min={1}
				max={14}
				step={0.5}
				onChange={handleContrastChange}
				onInteract={handleInteract}
				unit=":1"
				badge={
					<span
						className={`font-medium text-xs px-1.5 py-0.5 rounded-sm ${contrastBadge(contrastRatio).className}`}
					>
						{contrastBadge(contrastRatio).label}
					</span>
				}
			/>

			<div className="flex flex-col gap-1.5">
				<span className="text-sm">Adapt for color blindness</span>
				<Select.Root
					value={cvdType}
					onValueChange={(value) => {
						handleInteract();
						handleCvdChange(value as CVDType | 'none');
					}}
				>
					<Select.Trigger className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded-lg bg-base cursor-pointer hover:bg-base-strong">
						<Select.Value />
						<Select.Icon className="text-base-foreground">
							<NavArrowDown width="12" height="12" />
						</Select.Icon>
					</Select.Trigger>
					<Select.Portal>
						<Select.Content
							className="rounded-lg bg-base p-1 shadow-lg border border-base-strong z-50"
							position="popper"
							sideOffset={4}
						>
							<Select.Viewport>
								{[
									{ value: 'none' as const, label: 'None' },
									...CVD_OPTIONS,
								].map((opt) => (
									<Select.Item
										key={opt.value}
										value={opt.value}
										className="flex items-center gap-2 text-xs px-2 py-1.5 rounded cursor-pointer hover:bg-base-strong outline-none data-highlighted:bg-base-strong"
									>
										<Select.ItemText>{opt.label}</Select.ItemText>
									</Select.Item>
								))}
							</Select.Viewport>
						</Select.Content>
					</Select.Portal>
				</Select.Root>
			</div>

			<Button variant="ghost" onClick={handleReset} icon={RefreshDouble}>
				Reset to defaults
			</Button>
		</InteractiveCard>
	);
}
