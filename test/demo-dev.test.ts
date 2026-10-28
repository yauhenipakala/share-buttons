// @vitest-environment node
import { createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('demo dev server', () => {
  let server: ViteDevServer;

  beforeAll(async () => {
    server = await createServer({ configFile: 'vite.demo.config.mts', logLevel: 'silent', server: { middlewareMode: true } });
  }, 30_000);

  afterAll(async () => {
    await server.close();
  });

  it('serves the library source the pages point at', async () => {
    const lib = await server.transformRequest('/src/share-buttons.ts');

    expect(lib?.code).toContain('function update()');
  });
});
