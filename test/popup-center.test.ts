import { describe, expect, it, vi } from 'vitest';
import { popupCenter } from '../src/utils';

describe('popupCenter', () => {
  it('centers the window and keeps a zero position', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.stubGlobal('innerWidth', 600);
    vi.stubGlobal('innerHeight', 400);
    vi.stubGlobal('screenLeft', 0);
    vi.stubGlobal('screenTop', 0);

    popupCenter('https://a.example/');

    expect(open).toHaveBeenCalledWith('https://a.example/', '', 'resizable,toolbar=yes,location=yes,scrollbars=yes,menubar=yes,width=600,height=400,top=0,left=0');
  });

  it('takes a custom size', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 900);
    vi.stubGlobal('screenLeft', 10);
    vi.stubGlobal('screenTop', 20);

    popupCenter('https://a.example/', 500, 300);

    expect(open.mock.calls[0][2]).toContain('width=500,height=300,top=220,left=260');
  });

  it('focuses the opened window', () => {
    const focus = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({ focus } as unknown as Window);

    popupCenter('https://a.example/');

    expect(focus).toHaveBeenCalledTimes(1);
  });
});
