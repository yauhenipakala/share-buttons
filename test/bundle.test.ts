import fs from 'node:fs';
import zlib from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { FIXTURE_FULL, click, mount, shareBlock, stubBrowser } from './helpers';

const read = (file: string) => fs.readFileSync(file, 'utf8');
const bundle = () => read('dist/share-buttons.js');

// "super lightweight" promise from the README
const MAX_GZIP_SIZE = 2048;

describe('bundle', () => {
    afterEach(() => {
        delete (window as { ShareButtons?: unknown }).ShareButtons;
    });

    it('exposes window.ShareButtons when loaded as a classic script', () => {
        const { open } = stubBrowser();
        mount(shareBlock(FIXTURE_FULL, ['fb']));

        new Function(bundle()).call(window);

        expect(typeof window.ShareButtons.update).toBe('function');
        expect(typeof window.ShareButtons.register).toBe('function');
        expect(typeof window.ShareButtons.share).toBe('function');
        click('[data-id="fb"]');
        expect(open.mock.calls[0][0]).toBe(
            'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fpage%3Fa%3D1%26b%3D2&quote=Hello%20%26%20welcome',
        );
    });

    it('exposes update via CommonJS', () => {
        stubBrowser();
        const mod = { exports: {} as Record<string, unknown> };

        new Function('exports', 'module', bundle()).call(window, mod.exports, mod);

        expect(typeof mod.exports.update).toBe('function');
    });

    it('exposes the API as an ES module', async () => {
        stubBrowser();
        const mod = await import('../dist/share-buttons.mjs');

        expect(Object.keys(mod).sort()).toEqual(['register', 'share', 'update']);
    });

    it('package resolves import, require and types', () => {
        const pkg = JSON.parse(read('package.json'));

        expect(pkg.type).toBeUndefined();
        expect(pkg.main).toBe('dist/share-buttons.js');
        expect(pkg.module).toBe('dist/share-buttons.mjs');
        expect(pkg.types).toBe('dist/share-buttons.d.ts');
        expect(pkg.exports['.']).toEqual({
            import: { types: './dist/share-buttons.d.mts', default: './dist/share-buttons.mjs' },
            require: { types: './dist/share-buttons.d.ts', default: './dist/share-buttons.js' },
        });
        expect(pkg.files).toEqual(['dist']);
    });

    it('declarations are self-contained and describe the whole API', () => {
        const dts = read('dist/share-buttons.d.ts');

        for (const name of ['function update', 'function register', 'function share', 'interface ShareContent', 'type ShareHandler', 'type ShareId']) {
            expect(dts).toContain('export declare ' + name);
        }
        expect(dts).toContain('export as namespace ShareButtons;');
        expect(dts).not.toMatch(/\bimport\b/);
        expect(read('dist/share-buttons.d.mts')).toBe(dts);
        expect(fs.readdirSync('dist').sort()).toEqual(['share-buttons.d.mts', 'share-buttons.d.ts', 'share-buttons.js', 'share-buttons.mjs']);
    });

    it('bundle stays under 2 KB gzipped', () => {
        expect(zlib.gzipSync(bundle(), { level: 9 }).length).toBeLessThanOrEqual(MAX_GZIP_SIZE);
    });
});

declare global {
    interface Window {
        ShareButtons: typeof import('../src/share-buttons');
    }
}
