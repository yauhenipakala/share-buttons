// @vitest-environment node
import fs from 'node:fs';
import { createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('demo dev server', () => {
  let server: ViteDevServer;
  let html: string;

  beforeAll(async () => {
    server = await createServer({ configFile: 'vite.demo.config.mts', logLevel: 'silent', server: { middlewareMode: true } });
    html = await server.transformIndexHtml('/index.html', fs.readFileSync('demo/index.html', 'utf8'));
  }, 30_000);

  afterAll(async () => {
    await server.close();
  });

  it('page loads the library source', async () => {
    const lib = await server.transformRequest('/src/share-buttons.ts');

    expect(html).toContain('<script type="module" src="../src/share-buttons.ts"></script>');
    expect(html).not.toContain('share-buttons.min.js');
    expect(html).not.toContain('%VITE_ANALYTICS%');
    expect(lib?.code).toContain('function update()');
  });
});
