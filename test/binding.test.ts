import { describe, expect, it } from 'vitest';
import { click, loadShareButtons, mount, shareBlock, stubBrowser } from './helpers';

const NOT_SUPPORTED = 'This feature is not supported on this browser or operating system.';

describe('binding', () => {
  it('falls back to location, document.title and meta description', async () => {
    const { open } = stubBrowser();
    document.head.innerHTML = '<meta name="description" content="Meta desc">';
    document.title = 'Doc Title';
    mount(shareBlock({}, ['in']));
    await loadShareButtons();

    click('[data-id="in"]');

    expect(open.mock.calls[0][0]).toBe(
      'https://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fpage.example%2F&title=Doc%20Title&summary=Doc%20Title - Meta%20desc&source=https%3A%2F%2Fpage.example%2F',
    );
  });

  it('falls back to a single space when nothing is set', async () => {
    const { open } = stubBrowser();
    mount(shareBlock({}, ['fb']));
    await loadShareButtons();

    click('[data-id="fb"]');

    expect(open.mock.calls[0][0]).toBe('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fpage.example%2F&quote=%20');
  });

  it('each container uses its own data-url', async () => {
    const { open } = stubBrowser();
    mount(
      shareBlock({ url: 'https://a.example/' }, ['fb']) +
      shareBlock({ url: 'https://b.example/' }, ['fb']),
    );
    await loadShareButtons();

    document.querySelectorAll<HTMLElement>('[data-id="fb"]')[1].click();

    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][0]).toContain('u=https%3A%2F%2Fb.example%2F');
  });

  it('update() binds buttons added later', async () => {
    const { open } = stubBrowser();
    mount(shareBlock({}, []));
    const { update } = await loadShareButtons();

    document.querySelector('.share-btn')!.innerHTML = '<a data-id="fb">fb</a>';
    update();
    click('[data-id="fb"]');

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('update() twice does not double-bind', async () => {
    const { open } = stubBrowser();
    mount(shareBlock({}, ['fb']));
    const { update } = await loadShareButtons();

    update();
    update();
    click('[data-id="fb"]');

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('click on nested icon shares', async () => {
    const { open } = stubBrowser();
    mount('<div class="share-btn"><a data-id="fb"><i class="icon"></i> FB</a></div>');
    await loadShareButtons();

    click('.icon');

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('unknown data-id and links without data-id are ignored', async () => {
    const { open, print } = stubBrowser();
    mount('<div class="share-btn"><a data-id="nope">nope</a><a class="plain">plain</a></div>');
    await loadShareButtons();

    expect(() => {
      click('[data-id="nope"]');
      click('.plain');
    }).not.toThrow();
    expect(open).not.toHaveBeenCalled();
    expect(print).not.toHaveBeenCalled();
  });

  it('a value that cannot be encoded breaks only its own button', async () => {
    const { open } = stubBrowser();
    // a lone surrogate (e.g. a truncated emoji) makes encodeURIComponent throw
    mount(shareBlock({ url: 'https://good.example/' }, ['fb']) + shareBlock({ title: 'Emoji \uD83D' }, ['fb']));
    const { update } = await loadShareButtons();

    expect(typeof update).toBe('function');
    click('[data-id="fb"]');
    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][0]).toContain('u=https%3A%2F%2Fgood.example%2F');
  });

  it('hides copy and share when unsupported', async () => {
    const { log } = stubBrowser();
    mount(shareBlock({}, ['copy', 'share']));
    await loadShareButtons();

    expect(document.querySelector<HTMLElement>('[data-id="copy"]')!.style.display).toBe('none');
    expect(document.querySelector<HTMLElement>('[data-id="share"]')!.style.display).toBe('none');
    expect(log).toHaveBeenCalledWith('navigator.clipboard(): ' + NOT_SUPPORTED);
    expect(log).toHaveBeenCalledWith('navigator.share(): ' + NOT_SUPPORTED);
  });

  it('keeps copy and share when supported', async () => {
    stubBrowser({ clipboard: true, share: true });
    mount(shareBlock({}, ['copy', 'share']));
    await loadShareButtons();

    expect(document.querySelector<HTMLElement>('[data-id="copy"]')!.style.display).toBe('');
    expect(document.querySelector<HTMLElement>('[data-id="share"]')!.style.display).toBe('');
  });
});
