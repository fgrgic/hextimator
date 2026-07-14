import { createRoot, hydrateRoot } from 'react-dom/client';
import { AppShell } from './app-shell';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

const app = <AppShell />;

if (root.hasChildNodes()) {
	hydrateRoot(root, app);
} else {
	createRoot(root).render(app);
}
