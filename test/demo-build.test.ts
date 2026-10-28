// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('demo build', () => {
  let outDir: string;
  let html: string;

  beforeAll(async () => {
    process.env.ANALYTICS = '<meta name="analytics" content="probe">';
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-demo-'));
    await build({ configFile: 'vite.demo.config.mts', logLevel: 'silent', build: { outDir, emptyOutDir: true } });
    html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  }, 30_000);

  afterAll(() => {
    delete process.env.ANALYTICS;
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('uses the published bundle', () => {
    expect(html).toContain('src="js/share-buttons.min.js"');
    expect(html).not.toContain('../dist/');
    expect(fs.readFileSync(path.join(outDir, 'js/share-buttons.min.js'))).toEqual(fs.readFileSync('dist/share-buttons.js'));
  });

  it('injects analytics and minifies', () => {
    expect(html).toContain('content="probe"');
    expect(html).not.toContain('<!--');
    expect(html.length).toBeLessThan(fs.readFileSync('demo/index.html', 'utf8').length);
  });

  it('emits stylesheets referenced by the page', () => {
    const hrefs = [...html.matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1]).filter((href) => !/^https?:/.test(href));

    expect(hrefs).toEqual(['./css/styles.css', './css/print.css']);
    for (const href of hrefs) {
      expect(fs.existsSync(path.join(outDir, href))).toBe(true);
    }
  });

  it('copies stylesheets and images unchanged, so relative url() paths keep working', () => {
    for (const dir of ['css', 'images']) {
      const files = fs.readdirSync(path.join('demo/public', dir));

      expect(files.length).toBeGreaterThan(0);
      for (const file of files) {
        expect(fs.readFileSync(path.join(outDir, dir, file))).toEqual(fs.readFileSync(path.join('demo/public', dir, file)));
      }
    }
  });
});
