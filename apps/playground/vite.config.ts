import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';

function forceExitAfterPrerender(): Plugin {
	return {
		name: 'force-exit-after-prerender',
		apply: 'build',
		closeBundle() {
			setTimeout(() => process.exit(0), 500);
		},
	};
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		vitePrerenderPlugin({
			renderTarget: '#root',
			prerenderScript: fileURLToPath(
				new URL('./src/prerender.tsx', import.meta.url),
			),
		}),
		forceExitAfterPrerender(),
	],
	resolve: {
		dedupe: ['react', 'react-dom'],
	},
});
