import { Slider as SliderPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export function Slider({
	className,
	...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
	return (
		<SliderPrimitive.Root
			className={cn(
				'relative flex w-full touch-none items-center select-none',
				className,
			)}
			{...props}
		>
			<SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-surface cursor-pointer">
				<SliderPrimitive.Range className="absolute h-full bg-surface-weak" />
			</SliderPrimitive.Track>
			<SliderPrimitive.Thumb
				aria-label={props['aria-label'] ?? 'slider thumb'}
				className="block size-3 shrink-0 rounded-full bg-surface-foreground ring-surface-foreground/30 transition-shadow select-none hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 cursor-pointer"
			/>
		</SliderPrimitive.Root>
	);
}

export function RangeSlider({
	label,
	value,
	min,
	max,
	step,
	onChange,
	onInteract,
	unit,
	alwaysShowSign = false,
	badge,
	valueClassName,
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
	badge?: ReactNode;
	valueClassName?: string;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<span className="text-sm">
					{label}:
					<span
						className={cn(
							'bg-surface ml-2 rounded-sm px-1 font-bold',
							valueClassName,
						)}
					>
						{alwaysShowSign && value >= 0 ? '+' : ''}
						{value}
						{unit}
					</span>
				</span>
				{badge}
			</div>
			<Slider
				aria-label={label}
				min={min}
				max={max}
				step={step}
				value={[value]}
				onValueChange={([v]) => onChange(v)}
				onPointerDown={onInteract}
			/>
		</div>
	);
}
