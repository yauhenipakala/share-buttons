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
    process.env.VITE_ANALYTICS = '<meta name="analytics" content="probe">';
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-demo-'));
    await build({ configFile: 'vite.demo.config.mts', logLevel: 'silent', build: { outDir, emptyOutDir: true } });
    html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  }, 30_000);

  afterAll(() => {
    delete process.env.VITE_ANALYTICS;
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  const bundledScript = (page: string) => {
    const src = page.match(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/)?.[1];
    return fs.readFileSync(path.join(outDir, src!), 'utf8');
  };

  it('bundles the library into the page', () => {
    expect(html).not.toContain('../src/');
    expect(bundledScript(html)).toContain('share-btn');
  });

  it('injects analytics', () => {
    expect(html).toContain('<meta name="analytics" content="probe">');
  });

  it('emits stylesheets referenced by the page', () => {
    const hrefs = [...html.matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1]).filter((href) => !/^https?:/.test(href));

    expect(hrefs).toEqual(['./css/styles.css', './css/print.css']);
    for (const href of hrefs) {
      expect(fs.existsSync(path.join(outDir, href))).toBe(true);
    }
  });

  it('builds the dynamic buttons page with the library bundled in', () => {
    const page = fs.readFileSync(path.join(outDir, 'dynamic.html'), 'utf8');

    expect(page).not.toContain('../src/');
    expect(bundledScript(page)).toContain('share-btn');
    expect(page).toContain('content="probe"');
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
