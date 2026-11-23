import { CodeSnippet } from '../../code-snippet';
import { InteractiveCard } from '../interactive-card';

export function GetStarted() {
	return (
		<InteractiveCard className="flex flex-col gap-3 p-3">
			<CodeSnippet
				tabs={[
					{ label: 'npm', prefix: '❯', code: 'npm install hextimator' },
					{ label: 'bun', prefix: '❯', code: 'bun add hextimator' },
					{ label: 'pnpm', prefix: '❯', code: 'pnpm install hextimator' },
				]}
			/>
			<CodeSnippet
				code={`hextimate(accent).format(); // default theme
hextimate(accent, theme).format(); // your theme`}
			/>
		</InteractiveCard>
	);
}
