import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  base: './',
  // .env files live in the repo root; %VITE_ANALYTICS% in the pages comes from there or the environment
  envDir: '..',
  // the pages sit in demo/ and point at ../src/, which the browser requests as /src/
  resolve: { alias: [{ find: /^\/src\//, replacement: path.resolve('src') + '/' }] },
  build: {
    outDir: '../site',
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        index: path.resolve('demo/index.html'),
        dynamic: path.resolve('demo/dynamic.html'),
        register: path.resolve('demo/register.html'),
      },
    },
  },
});
