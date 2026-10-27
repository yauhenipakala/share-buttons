import { describe, expect, it, vi } from 'vitest';
import { FIXTURE_FULL, POPUP_IDS, click, loadShareButtons, mount, shareBlock, stubBrowser } from './helpers';

describe('share urls', () => {
    it.each(POPUP_IDS)('popup %s url', async (id) => {
        const { open } = stubBrowser();
        mount(shareBlock(FIXTURE_FULL, [id]));
        await loadShareButtons();

        click(`[data-id="${id}"]`);

        expect(open).toHaveBeenCalledTimes(1);
        expect(open.mock.calls[0][0]).toMatchSnapshot();
        expect(open.mock.calls[0][1]).toBe('');
    });

    it('popup window features', async () => {
        const { open } = stubBrowser();
        mount(shareBlock(FIXTURE_FULL, ['fb']));
        await loadShareButtons();

        click('[data-id="fb"]');

        expect(open.mock.calls[0][2]).toMatchSnapshot();
    });

    it('mail url', async () => {
        const { location } = stubBrowser();
        mount(shareBlock(FIXTURE_FULL, ['mail']));
        await loadShareButtons();

        click('[data-id="mail"]');

        expect(location.href).toMatchSnapshot();
    });

    it('mail url with fallback values', async () => {
        const { location } = stubBrowser();
        mount(shareBlock({}, ['mail']));
        await loadShareButtons();

        click('[data-id="mail"]');

        expect(location.href).toMatchSnapshot();
    });

    it('print', async () => {
        const { open, print } = stubBrowser();
        mount(shareBlock(FIXTURE_FULL, ['print']));
        await loadShareButtons();

        click('[data-id="print"]');

        expect(print).toHaveBeenCalledTimes(1);
        expect(open).not.toHaveBeenCalled();
    });

    it('copy', async () => {
        const { writeText } = stubBrowser({ clipboard: true });
        mount(shareBlock(FIXTURE_FULL, ['copy']));
        await loadShareButtons();

        click('[data-id="copy"]');

        expect(writeText).toHaveBeenCalledWith('https://example.com/page?a=1&b=2');
    });

    it('share', async () => {
        const { share } = stubBrowser({ share: true });
        mount(shareBlock(FIXTURE_FULL, ['share']));
        await loadShareButtons();

        click('[data-id="share"]');

        expect(share).toHaveBeenCalledWith({
            title: 'Hello & welcome - Привет мир',
            text: 'Hello & welcome - Привет мир',
            url: 'https://example.com/page?a=1&b=2',
        });
    });

    // v1.10.0 drops `err` when logging; Task 2 fixes it and flips this to `it`.
    it.fails('share rejection logs err', async () => {
        const { share, log } = stubBrowser({ share: true });
        const err = new DOMException('cancel', 'AbortError');
        share.mockRejectedValue(err);
        mount(shareBlock(FIXTURE_FULL, ['share']));
        await loadShareButtons();

        click('[data-id="share"]');

        await vi.waitFor(() => expect(log).toHaveBeenCalledWith('navigator.share(): Error', err));
    });
});
