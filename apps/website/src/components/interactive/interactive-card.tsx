import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../utils/cn';

export function InteractiveCard(props: ComponentPropsWithRef<'div'>) {
	return (
		<div
			{...props}
			className={cn(
				'flex flex-col flex-1 bg-base-strong rounded-xl border border-(--color-base-weak) pb-6 pt-4 px-4 mt-4 md:mt-0 md:mx-12 text-base-foreground max-w-sm',
				props.className,
			)}
		>
			{props.children}
		</div>
	);
}
