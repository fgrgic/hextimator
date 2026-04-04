import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					editor: ['codemirror', '@codemirror/view', '@codemirror/state', '@codemirror/lang-javascript', '@codemirror/theme-one-dark'],
					ui: ['radix-ui', 'iconoir-react'],
				},
			},
		},
	},
});
