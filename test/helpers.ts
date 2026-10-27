import { vi } from 'vitest';

export const FIXTURE_FULL = {
    url: 'https://example.com/page?a=1&b=2',
    title: 'Hello & welcome',
    desc: 'Привет мир',
};

export const POPUP_IDS = ['fb', 'vk', 'tw', 'tg', 'pk', 're', 'ev', 'in', 'pi', 'wa', 'ok', 'tu', 'hn', 'xi', 'mst'] as const;

export const PAGE_HREF = 'https://page.example/';

type ShareAttrs = Partial<{ url: string; title: string; desc: string }>;

const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

export function mount(html: string): void {
    document.body.innerHTML = html;
}

export function shareBlock(attrs: ShareAttrs, ids: string[]): string {
    const dataAttrs = (['url', 'title', 'desc'] as const)
        .filter((key) => attrs[key] !== undefined)
        .map((key) => ` data-${key}="${escapeAttr(attrs[key] as string)}"`)
        .join('');
    const links = ids.map((id) => `<a data-id="${id}">${id}</a>`).join('');
    return `<div class="share-btn"${dataAttrs}>${links}</div>`;
}

export function stubBrowser(opts: { clipboard?: boolean; share?: boolean } = {}) {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const location = { href: PAGE_HREF };
    const writeText = vi.fn();
    const share = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal('location', location);
    vi.stubGlobal('navigator', {
        ...(opts.clipboard && { clipboard: { writeText } }),
        ...(opts.share && { canShare: vi.fn(() => true), share }),
    });

    return { open, print, log, location, writeText, share };
}

export async function loadShareButtons(): Promise<{ update(): void }> {
    vi.resetModules();
    // @ts-ignore legacy untyped JS (removed in Task 2)
    return import('../src/share-buttons.js');
}

export function click(selector: string): void {
    document.querySelector<HTMLElement>(selector)!.click();
}
