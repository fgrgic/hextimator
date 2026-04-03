import { ArrowUpRight } from 'iconoir-react';
import { Button } from '../../button';
import { CodeSnippet } from '../../code-snippet';
import { InteractiveCard } from '../interactive-card';

export function GetStarted() {
	return (
		<InteractiveCard className="p-3">
			<h2>Install hextimator</h2>
			<CodeSnippet
				tabs={[
					{ label: 'npm', prefix: '❯', code: 'npm install hextimator' },
					{ label: 'bun', prefix: '❯', code: 'bun add hextimator' },
					{ label: 'pnpm', prefix: '❯', code: 'pnpm install hextimator' },
				]}
			/>
			<div className="flex flex-col gap-2">
				<h3>Using tailwind?</h3>
				<CodeSnippet code="@import 'hextimator/tailwind.css';" />
			</div>
			<Button
				icon={ArrowUpRight}
				href="https://github.com/fgrgic/hextimator/packages/hextimator"
			>
				Check out installation docs
			</Button>
		</InteractiveCard>
	);
}
