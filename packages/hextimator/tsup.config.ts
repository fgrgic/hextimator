import { defineConfig } from 'tsup';

export default defineConfig([
	{
		entry: {
			index: 'src/index.ts',
			react: 'src/react/index.ts',
		},
		external: ['react'],
		format: ['esm'],
		dts: true,
		clean: true,
	},
	{
		entry: ['src/cli.ts'],
		format: ['esm'],
		banner: { js: '#!/usr/bin/env node' },
		dts: false,
		clean: false,
	},
]);
