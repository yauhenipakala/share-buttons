export const NOT_SUPPORTED_MESSAGE = 'This feature is not supported on this browser or operating system.';

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
 * Method for opening a popup window centered over the current one
 */
export function popupCenter(url: string, width = 600, height = 400): void {
    const viewWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
    const viewHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;
    const left = viewWidth / 2 - width / 2 + window.screenLeft;
    const top = viewHeight / 3 - height / 3 + window.screenTop;
    const popup = window.open(url, '', `resizable,toolbar=yes,location=yes,scrollbars=yes,menubar=yes,width=${width},height=${height},top=${top},left=${left}`);

    if (popup !== null && popup.focus) {
        popup.focus();
    }
}
