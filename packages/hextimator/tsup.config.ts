import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts', 'src/react.tsx'],
	external: ['react'],
	format: ['cjs', 'esm'],
	dts: true,
	clean: true,
});
