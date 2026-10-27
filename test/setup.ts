import { afterEach, vi } from 'vitest';

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (typeof document === 'undefined') {
        return;
    }
    document.body.innerHTML = '';
    document.title = '';
    document.head.innerHTML = '';
});
