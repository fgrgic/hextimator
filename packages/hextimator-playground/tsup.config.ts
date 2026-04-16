import { cpSync } from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  external: ['react', 'react-dom'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  onSuccess: async () => {
    cpSync('src/style.css', 'dist/style.css');
  },
});
