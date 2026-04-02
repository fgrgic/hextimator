import { CodeSnippet } from '../../code-snippet';
import { InteractiveCard } from '../interactive-card';

export function AIReady() {
	return (
		<InteractiveCard className="p-3">
			<CodeSnippet
				tabs={[
					{ label: 'basic', prefix: '❯', code: 'npx hextimate "#ff6677"' },
					{ label: 'bunx', prefix: '❯', code: 'bunx hextimate "#ff6677"' },
					{ label: 'pnpx', prefix: '❯', code: 'pnpx hextimate "#ff6677"' },
				]}
			/>
		</InteractiveCard>
	);
}
