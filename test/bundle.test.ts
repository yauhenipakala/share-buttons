import fs from 'node:fs';
import zlib from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { FIXTURE_FULL, click, mount, shareBlock, stubBrowser } from './helpers';

const read = (file: string) => fs.readFileSync(file, 'utf8');
const bundle = () => read('dist/share-buttons.js');

// v1.10.0 dist/share-buttons.js, gzip -9
const V1_GZIP_SIZE = 1738;

describe('bundle', () => {
    afterEach(() => {
        delete (window as { ShareButtons?: unknown }).ShareButtons;
    });

    it('exposes window.ShareButtons when loaded as a classic script', () => {
        const { open } = stubBrowser();
        mount(shareBlock(FIXTURE_FULL, ['fb']));

        new Function(bundle()).call(window);

        expect(typeof window.ShareButtons.update).toBe('function');
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

    it('package stays CommonJS-compatible', () => {
        const pkg = JSON.parse(read('package.json'));

        expect(pkg.type).toBeUndefined();
        expect(pkg.main).toBe('dist/share-buttons.js');
        expect(pkg.types).toBe('dist/share-buttons.d.ts');
        expect(pkg.files).toEqual(['dist']);
    });

    it('declarations are a single self-contained file', () => {
        const dts = read('dist/share-buttons.d.ts');

        expect(dts).toContain('export declare function update(): void;');
        expect(dts).toContain('export as namespace ShareButtons;');
        expect(dts).not.toMatch(/\bimport\b/);
        expect(fs.readdirSync('dist').sort()).toEqual(['share-buttons.d.ts', 'share-buttons.js']);
    });

    it('bundle is no larger than v1.10.0', () => {
        expect(zlib.gzipSync(bundle(), { level: 9 }).length).toBeLessThanOrEqual(V1_GZIP_SIZE);
    });
});

declare global {
    interface Window {
        ShareButtons: typeof import('../src/share-buttons');
    }
}
