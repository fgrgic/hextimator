import { type ComponentPropsWithRef, useState } from 'react';
import { cn } from '../../utils/cn';

export function InteractiveCard({
	rotate,
	...props
}: ComponentPropsWithRef<'div'> & { rotate?: boolean }) {
	const [rotation] = useState(() => {
		if (!rotate) return 0;
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
				'flex flex-col flex-1 bg-surface-strong rounded-xl border border-surface-weak hover:border-surface hover:shadow-lg pb-6 pt-4 px-4 mt-4 -mx-2 md:mx-0 md:mt-0 text-surface-foreground gap-6',
				'rotate-(--card-rotation)',
				props.className,
			)}
		>
			{props.children}
		</div>
	);
}
