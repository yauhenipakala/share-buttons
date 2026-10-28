// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('demo build', () => {
  let outDir: string;

  beforeAll(async () => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-demo-'));
    await build({ configFile: 'vite.demo.config.mts', logLevel: 'silent', build: { outDir, emptyOutDir: true } });
  }, 30_000);

  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('creates the demo pages, their scripts and static files', () => {
    const files = fs.readdirSync(outDir, { recursive: true }).map(String);

    for (const page of ['index.html', 'dynamic.html', 'register.html']) {
      expect(files).toContain(page);
    }
    expect(files.some((file) => /^assets[\\/].+\.js$/.test(file))).toBe(true);
    for (const dir of ['css', 'images']) {
      for (const file of fs.readdirSync(path.join('demo/public', dir))) {
        expect(files).toContain(path.join(dir, file));
      }
    }
  });
});
