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
				'flex flex-col md:flex-row mt-12 mb-8 px-6 text-base-foreground mx-auto max-w-5xl',
				reversed && 'md:flex-row-reverse',
			)}
		>
			<div className="flex flex-col flex-1  justify-center max-w-sm">
				<h2>{title}</h2>
				<p className="text-sm">{description}</p>
			</div>
			<div className="flex flex-1 justify-center">{children}</div>
		</div>
	);
}
