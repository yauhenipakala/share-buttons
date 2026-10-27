import type { ShareContext } from './networks';

export type ActionId = 'mail' | 'print' | 'copy' | 'share';

export const SHARE_LOG_TAG = 'navigator.share(): ';
export const NOT_SUPPORTED_MESSAGE = 'This feature is not supported on this browser or operating system.';

const MAIL_LINK_FORMAT = 'mailto:?subject={0}&body={1}';
const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 400;
const WINDOW_FORMAT = 'resizable,toolbar=yes,location=yes,scrollbars=yes,menubar=yes,width={0},height={1},top={2},left={3}';

/**
 * Method for get string in the special format by arguments
 * from https://ypakala.com/notes/string-format-for-string-formating-in-javascript
 */
export function stringFormat(str: string, args: ReadonlyArray<string | number>): string {
    return str.replace(/\{(\d+)\}/g, (m, n: string) => String(args[Number(n)] || m));
}

/**
 * Method for merge array of strings to the special format string
 */
export function mergeForTitle(texts: string[]): string {
    return texts.join(' - ');
}

/**
 * Log method for debug
 */
export function log(...args: unknown[]): void {
    window.console.log(...args);
}

/**
 * Method for opening popup window
 */
export function popupCenter(url: string): void {
    const w = window;
    const d = w.document;
    const legacyScreen = screen as Screen & { left?: number; top?: number };
    const dualScreenLeft = typeof w.screenLeft !== 'undefined' ? w.screenLeft : legacyScreen.left as number;
    const dualScreenTop = typeof w.screenTop !== 'undefined' ? w.screenTop : legacyScreen.top as number;
    const width = w.innerWidth || d.documentElement.clientWidth || screen.width;
    const height = w.innerHeight || d.documentElement.clientHeight || screen.height;
    const left = ((width / 2) - (POPUP_WIDTH / 2)) + dualScreenLeft;
    const top = ((height / 3) - (POPUP_HEIGHT / 3)) + dualScreenTop;
    const newWindow = w.open(url, '', stringFormat(WINDOW_FORMAT, [POPUP_WIDTH, POPUP_HEIGHT, top, left]));

    if (newWindow !== null && newWindow.focus) {
        newWindow.focus();
    }
}

const decode = (text: string) => decodeURIComponent(text);

/**
 * Share actions that don't open a popup window
 */
export const ACTIONS: Record<ActionId, (c: ShareContext) => void> = {
    mail: ({ url, title, desc }) => {
        let text = title || desc || '';
        if (title.length > 0 && desc.length > 0) {
            text = mergeForTitle([title, desc]);
        }
        if (url.length > 0) {
            text = text + ' / ' + url;
        }

        window.location.href = stringFormat(MAIL_LINK_FORMAT, [title, text]);
    },

    print: () => {
        window.print();
    },

    copy: ({ url }) => {
        window.navigator.clipboard.writeText(decode(url));
    },

    share: ({ url, title, desc }) => {
        const text = decode(mergeForTitle([title, desc]));

        window.navigator.share({ title: text, text, url: decode(url) })
            .catch((err) => {
                log(SHARE_LOG_TAG + 'Error', err);
            });
    },
};

export function isAction(id: string): id is ActionId {
    return Object.prototype.hasOwnProperty.call(ACTIONS, id);
}
