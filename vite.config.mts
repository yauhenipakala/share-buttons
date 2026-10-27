import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        target: 'es2015',
        sourcemap: false,
        emptyOutDir: true,
        lib: {
            entry: 'src/share-buttons.ts',
            formats: ['umd'],
            name: 'ShareButtons',
            fileName: () => 'share-buttons.js',
        },
        rolldownOptions: {
            // plain exports object like v1, no Symbol.toStringTag marker
            output: { generatedCode: { symbols: false } },
        },
    },
    plugins: [
        dts({
            include: ['src'],
            // Ship only the entry's declarations (it exports nothing but `update`), usable as a global too
            beforeWriteFile: (filePath, content) => filePath.endsWith('/share-buttons.d.ts')
                ? { filePath, content: content + '\nexport as namespace ShareButtons;\n' }
                : false,
        }),
    ],
    test: {
        environment: 'jsdom',
        include: ['test/**/*.test.ts'],
        setupFiles: ['test/setup.ts'],
    },
});
