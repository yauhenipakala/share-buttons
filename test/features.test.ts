import { describe, expect, it } from 'vitest';
import { FIXTURE_FULL, click, loadShareButtons, mount, shareBlock, stubBrowser } from './helpers';

const URL_ENC = 'https%3A%2F%2Fexample.com%2Fpage%3Fa%3D1%26b%3D2';
const MERGED_ENC = 'Hello%20%26%20welcome - %D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82%20%D0%BC%D0%B8%D1%80';

async function popupUrl(id: string): Promise<string | undefined> {
    const { open } = stubBrowser();
    mount(shareBlock(FIXTURE_FULL, [id]));
    await loadShareButtons();
    click(`[data-id="${id}"]`);
    return open.mock.calls[0]?.[0] as string | undefined;
}

function keydown(selector: string, key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    document.querySelector(selector)!.dispatchEvent(event);
    return event;
}

describe('networks', () => {
    it('tw shares to x.com', async () => {
        expect(await popupUrl('tw')).toBe(`https://x.com/intent/tweet?url=${URL_ENC}&text=${MERGED_ENC}`);
    });

    it('x is an alias of tw', async () => {
        expect(await popupUrl('x')).toBe(await popupUrl('tw'));
    });

    it('bs shares to Bluesky with the link in the text', async () => {
        expect(await popupUrl('bs')).toBe(`https://bsky.app/intent/compose?text=${MERGED_ENC}%20${URL_ENC}`);
    });

    it('th shares to Threads', async () => {
        expect(await popupUrl('th')).toBe(`https://www.threads.com/intent/post?text=${MERGED_ENC}&url=${URL_ENC}`);
    });

    it('pk (Pocket, shut down) is gone', async () => {
        expect(await popupUrl('pk')).toBeUndefined();
    });
});

describe('register()', () => {
    it('adds a popup network from a template with named placeholders', async () => {
        const { open } = stubBrowser();
        mount(shareBlock(FIXTURE_FULL, ['myNet']));
        const { register } = await loadShareButtons();

        register('myNet', 'https://my.example/share?u={url}&t={title}&d={desc}&u2={url}');
        click('[data-id="myNet"]');

        expect(open.mock.calls[0][0]).toBe(
            `https://my.example/share?u=${URL_ENC}&t=Hello%20%26%20welcome&d=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82%20%D0%BC%D0%B8%D1%80&u2=${URL_ENC}`,
        );
    });

    it('adds a custom handler that gets raw values', async () => {
        stubBrowser();
        mount(shareBlock(FIXTURE_FULL, ['log']));
        const { register } = await loadShareButtons();
        const calls: unknown[] = [];

        register('log', (data) => calls.push(data));
        click('[data-id="log"]');

        expect(calls).toEqual([FIXTURE_FULL]);
    });

    it('overrides a built-in network', async () => {
        const { open } = stubBrowser();
        mount(shareBlock(FIXTURE_FULL, ['fb']));
        const { register } = await loadShareButtons();
        const calls: unknown[] = [];

        register('fb', (data) => calls.push(data));
        click('[data-id="fb"]');

        expect(open).not.toHaveBeenCalled();
        expect(calls).toHaveLength(1);
    });
});

describe('share()', () => {
    it('shares without markup, falling back to page values', async () => {
        const { open } = stubBrowser();
        document.title = 'Doc Title';
        const { share } = await loadShareButtons();

        expect(share('fb', { title: 'Custom' })).toBe(true);
        expect(open.mock.calls[0][0]).toBe('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fpage.example%2F&quote=Custom');
    });

    it('works with registered networks', async () => {
        stubBrowser();
        const { register, share } = await loadShareButtons();
        const calls: unknown[] = [];

        register('log', (data) => calls.push(data));

        expect(share('log', { url: 'https://a.example/', title: 'T', desc: 'D' })).toBe(true);
        expect(calls).toEqual([{ url: 'https://a.example/', title: 'T', desc: 'D' }]);
    });

    it('returns false for an unknown id', async () => {
        const { open } = stubBrowser();
        const { share } = await loadShareButtons();

        expect(share('nope')).toBe(false);
        expect(open).not.toHaveBeenCalled();
    });
});

describe('keyboard', () => {
    it('makes links without href focusable buttons', async () => {
        stubBrowser();
        mount(shareBlock(FIXTURE_FULL, ['fb']));
        await loadShareButtons();
        const link = document.querySelector('[data-id="fb"]')!;

        expect(link.getAttribute('role')).toBe('button');
        expect(link.getAttribute('tabindex')).toBe('0');
    });

    it('keeps role and tabindex set by the page', async () => {
        stubBrowser();
        mount('<div class="share-btn"><a data-id="fb" role="link" tabindex="-1">fb</a></div>');
        await loadShareButtons();
        const link = document.querySelector('[data-id="fb"]')!;

        expect(link.getAttribute('role')).toBe('link');
        expect(link.getAttribute('tabindex')).toBe('-1');
    });

    it('leaves links with href alone', async () => {
        stubBrowser();
        mount('<div class="share-btn"><a data-id="fb" href="#">fb</a></div>');
        await loadShareButtons();

        expect(document.querySelector('[data-id="fb"]')!.hasAttribute('role')).toBe(false);
    });

    it('Enter and Space share once each, even after update()', async () => {
        const { open } = stubBrowser();
        mount(shareBlock(FIXTURE_FULL, ['fb']));
        const { update } = await loadShareButtons();
        update();

        const space = keydown('[data-id="fb"]', ' ');
        keydown('[data-id="fb"]', 'Enter');
        keydown('[data-id="fb"]', 'a');

        expect(open).toHaveBeenCalledTimes(2);
        expect(space.defaultPrevented).toBe(true);
    });
});
