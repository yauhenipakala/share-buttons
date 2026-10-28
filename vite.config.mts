import fs from 'node:fs';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

const DTS = 'dist/share-buttons.d.ts';

export default defineConfig({
  build: {
    target: 'es2015',
    sourcemap: false,
    // Watch mode builds each format separately, emptying would delete the other format's files
    emptyOutDir: false,
    lib: {
      entry: 'src/share-buttons.ts',
      formats: ['es', 'umd'],
      name: 'ShareButtons',
      fileName: (format) => format === 'es' ? 'share-buttons.mjs' : 'share-buttons.js',
    },
    rolldownOptions: {
      // plain exports object like v1, no Symbol.toStringTag marker
      output: { generatedCode: { symbols: false } },
    },
  },
  plugins: [
    {
      ...dts({
        include: ['src'],
        bundleTypes: true,
        // Same declarations for require (.d.ts) and import (.d.mts), also usable as the global `ShareButtons`
        afterBuild: () => {
          const content = fs.readFileSync(DTS, 'utf8') + '\nexport as namespace ShareButtons;\n';
          fs.writeFileSync(DTS, content);
          fs.writeFileSync(DTS.replace(/\.ts$/, '.mts'), content);
        },
      }),
      // Declarations are for publishing; watch mode builds the formats in parallel and they would race
      apply: (config, { command }) => command === 'build' && !config.build?.watch,
    },
  ],
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
  },
});
