import { renderToString } from 'react-dom/server';
import { AppShell } from './app-shell';

export async function prerender() {
	const html = renderToString(<AppShell />);
	return { html };
}
