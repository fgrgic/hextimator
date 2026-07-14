import { createRoot, hydrateRoot } from 'react-dom/client';
import { AppShell } from './app-shell';
import './index.css';
import { getColorFromPath, isHexPath } from './playground-color';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

const initialColor = getColorFromPath(window.location.pathname);
const app = <AppShell initialColor={initialColor} />;

if (root.hasChildNodes() && !isHexPath(window.location.pathname)) {
	hydrateRoot(root, app);
} else {
	root.replaceChildren();
	createRoot(root).render(app);
}
