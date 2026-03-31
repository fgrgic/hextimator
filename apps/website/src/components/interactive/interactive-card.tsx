import { type ComponentPropsWithRef, useState } from 'react';
import { cn } from '../../utils/cn';

export function InteractiveCard(props: ComponentPropsWithRef<'div'>) {
	const [rotation] = useState(() => {
		const sign = Math.random() < 0.5 ? -1 : 1;
		const value = Math.round((Math.random() * 0.4 + 0.4) * 10) / 10;
		return sign * value;
	});

	return (
		<div
			{...props}
			style={
				{
					'--card-rotation': `${rotation}deg`,
					...props.style,
				} as React.CSSProperties
			}
			className={cn(
				'flex flex-col flex-1 bg-base-strong rounded-xl border border-(--color-base-weak) pb-6 pt-4 px-4 mt-8 -mx-2 md:mt-0 md:mx-auto text-base-foreground max-w-sm gap-4',
				'rotate-(--card-rotation)',
				props.className,
			)}
		>
			{props.children}
		</div>
	);
}
