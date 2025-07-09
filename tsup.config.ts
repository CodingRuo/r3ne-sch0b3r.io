import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
    publicDir: false,
    onSuccess: 'cp src/styles.css dist/styles.css',
});