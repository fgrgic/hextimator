import { HextimatorProvider } from 'hextimator/react';
import { StrictMode } from 'react';
import App from './App.tsx';

export function AppShell() {
	return (
		<StrictMode>
			<HextimatorProvider
				defaultColor="ff6677"
				darkMode={{ type: 'media-or-class' }}
				style={{
					baseLightness: 0.6,
				}}
			>
				<App />
			</HextimatorProvider>
		</StrictMode>
	);
}
