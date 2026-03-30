import type { PropsWithChildren } from 'react';

type SectionProps = PropsWithChildren<{
	title: string;
	description: string;
}>;

export function Section({ title, description, children }: SectionProps) {
	return (
		<div className="flex flex-col md:flex-row mt-12 mb-8 px-6 text-base-foreground mx-auto max-w-5xl">
			<div className="flex flex-col flex-1 md:mt-12  justify-center max-w-sm">
				<h2>{title}</h2>
				<p className="text-sm">{description}</p>
			</div>
			<div className="flex flex-1 justify-center">{children}</div>
		</div>
	);
}
