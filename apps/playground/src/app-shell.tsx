import { HextimatorProvider } from 'hextimator/react';
import { StrictMode } from 'react';
import App from './App.tsx';
import { DEFAULT_PLAYGROUND_COLOR } from './playground-color';

export function AppShell({
	initialColor = DEFAULT_PLAYGROUND_COLOR,
}: {
	initialColor?: string;
}) {
	return (
		<StrictMode>
			<HextimatorProvider
				defaultColor={initialColor}
				darkMode={{ type: 'media-or-class' }}
			>
				<App />
			</HextimatorProvider>
		</StrictMode>
	);
}
