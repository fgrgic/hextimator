import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../utils/cn';

type SectionProps = ComponentPropsWithRef<'div'> & {
	title: string;
	description: string;
	reversed?: boolean;
};

export function Section({
	title,
	description,
	children,
	reversed,
}: SectionProps) {
	return (
		<div
			className={cn(
				'flex flex-col md:flex-row md:justify-center mt-12 mb-8 px-6 text-base-foreground mx-auto max-w-5xl md:gap-6',
				reversed && 'md:flex-row-reverse',
			)}
		>
			<div className="flex flex-col flex-1 justify-center max-w-md">
				<h2>{title}</h2>
				<p className="text font-light">{description}</p>
			</div>
			<div className="flex flex-1 justify-start max-w-md">{children}</div>
		</div>
	);
}
