import { ACTIONS, NOT_SUPPORTED_MESSAGE, SHARE_LOG_TAG, isAction, log, popupCenter, stringFormat } from './actions';
import { POPUP_NETWORKS, isPopupNetwork } from './networks';

const COPY_ID = 'copy';
const SHARE_ID = 'share';
const REF_ATTRIBUTE = 'data-sharebtn-ref';

interface ShareOptions {
    url: string;
    title: string;
    desc: string;
}

/**
 * Counter for generated cache's share button's index.
 * This to reference added share buttons' listeners.
 */
let refCounter = 0;

/**
 * List of added listeners' for share buttons.
 * This to index listeners' for update or removal purpose.
 */
const listeners: Record<string, EventListener> = {};

/**
 * Set display=none for elements by selector
 */
function hideAll(selector: string): void {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    for (let i = 0; i < elements.length; i++) {
        elements[i].style.display = 'none';
    }
}

/**
 * Method for getting url from page or options
 */
function getUrl(share: Element): string {
    return share.getAttribute('data-url') || window.location.href || ' ';
}

/**
 * Method for getting title from page or options
 */
function getTitle(share: Element): string {
    return share.getAttribute('data-title') || document.title || ' ';
}

/**
 * Method for getting description from page or options
 */
function getDesc(share: Element): string {
    const metaDesc = document.querySelector('meta[name=description]');
    return share.getAttribute('data-desc') || (metaDesc && metaDesc.getAttribute('content')) || ' ';
}

/**
 * Method for handling chosen links
 */
function share(id: string, options: ShareOptions): void {
    const ctx = {
        url: encodeURIComponent(options.url),
        title: encodeURIComponent(options.title),
        desc: encodeURIComponent(options.desc),
    };

    if (isPopupNetwork(id)) {
        const network = POPUP_NETWORKS[id];
        popupCenter(stringFormat(network.format, network.args(ctx)));
    } else if (isAction(id)) {
        ACTIONS[id](ctx);
    }
}

/**
 * Method for attaching the click handler to the link, replacing a previously attached one
 */
function bindLink(el: Element, options: ShareOptions): void {
    const id = el.getAttribute('data-id');
    if (!id) {
        return;
    }

    let ref = el.getAttribute(REF_ATTRIBUTE);
    if (ref) {
        el.removeEventListener('click', listeners[ref]);
    } else {
        ref = String(++refCounter);
        el.setAttribute(REF_ATTRIBUTE, ref);
    }

    listeners[ref] = () => share(id, options);
    el.addEventListener('click', listeners[ref]);
}

/**
 * Method for initialize all links of the container
 */
function initForElement(el: Element): void {
    const links = el.querySelectorAll('a');

    for (let i = links.length; i--;) {
        bindLink(links[i], {
            url: getUrl(el),
            title: getTitle(el),
            desc: getDesc(el),
        });
    }
}

/**
 * Initialize (or re-initialize) share buttons on the page.
 */
export function update(): void {
    const containers = document.querySelectorAll('.share-btn');

    for (let i = containers.length; i--;) {
        initForElement(containers[i]);
    }

    // Check if navigator.clipboard is supported. If not, hide all copy buttons.
    if (!window.navigator.clipboard) {
        hideAll('[data-id="' + COPY_ID + '"]');
        log('navigator.clipboard(): ' + NOT_SUPPORTED_MESSAGE);
    }

    // Check if navigator.share is supported. If not, hide all share buttons.
    if (!window.navigator.canShare) {
        hideAll('[data-id="' + SHARE_ID + '"]');
        log(SHARE_LOG_TAG + NOT_SUPPORTED_MESSAGE);
    }
}

// start
update();
