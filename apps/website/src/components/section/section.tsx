import type { ComponentPropsWithRef } from 'react';
import { cn } from '../../utils/cn';

type SectionProps = ComponentPropsWithRef<'div'> & {
	title: string;
	description: string;
	reversed?: boolean;
	stacked?: boolean;
};

export function Section({
	title,
	description,
	children,
	reversed,
	stacked,
}: SectionProps) {
	if (stacked) {
		return (
			<div className="flex flex-col mb-8 px-6 mt-16 text-base-foreground max-w-5xl gap-6 ">
				<div className="flex flex-col">
					<h2>{title}</h2>
					<p className="text font-light">{description}</p>
				</div>
				<div className="w-full">{children}</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				'flex flex-col items-stretch mb-8 px-6 mt-16 text-base-foreground md:flex-row max-w-5xl md:gap-8',
				reversed && 'md:flex-row-reverse',
			)}
		>
			<div className="flex flex-col flex-1 justify-center">
				<h2>{title}</h2>
				<p className="text font-light">{description}</p>
			</div>
			<div className="flex flex-1">{children}</div>
		</div>
	);
}
