// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('server-side rendering', () => {
    it('importing the ES module without a DOM does not throw', async () => {
        const mod = await import('../dist/share-buttons.mjs');

        expect(typeof mod.update).toBe('function');
    });
});
