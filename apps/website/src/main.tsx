import { HextimatorProvider } from 'hextimator/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
createRoot(root).render(
	<StrictMode>
		<HextimatorProvider defaultColor="#ff6677">
			<App />
		</HextimatorProvider>
	</StrictMode>,
);
