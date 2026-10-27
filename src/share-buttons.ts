import { ACTIONS, NOT_SUPPORTED_MESSAGE, SHARE_LOG_TAG, isAction, log, popupCenter, stringFormat } from './actions';
import { POPUP_NETWORKS, isPopupNetwork, type ShareContext } from './networks';

const COPY_ID = 'copy';
const SHARE_ID = 'share';
const REF_ATTRIBUTE = 'data-sharebtn-ref';

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
 * Method for getting url, title and description from the container or the page, encoded for links
 */
function getContext(share: Element): ShareContext {
    const metaDesc = document.querySelector('meta[name=description]');

    return {
        url: encodeURIComponent(share.getAttribute('data-url') || window.location.href || ' '),
        title: encodeURIComponent(share.getAttribute('data-title') || document.title || ' '),
        desc: encodeURIComponent(share.getAttribute('data-desc') || (metaDesc && metaDesc.getAttribute('content')) || ' '),
    };
}

/**
 * Method for handling chosen links
 */
function share(id: string, ctx: ShareContext): void {
    if (isPopupNetwork(id)) {
        const [format, args] = POPUP_NETWORKS[id];
        popupCenter(stringFormat(format, args(ctx)));
    } else if (isAction(id)) {
        ACTIONS[id](ctx);
    }
}

/**
 * Method for attaching the click handler to the link, replacing a previously attached one
 */
function bindLink(el: Element, ctx: ShareContext): void {
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

    listeners[ref] = () => share(id, ctx);
    el.addEventListener('click', listeners[ref]);
}

/**
 * Method for initialize all links of the container
 */
function initForElement(el: Element): void {
    const links = el.querySelectorAll('a');
    const ctx = getContext(el);

    for (let i = links.length; i--;) {
        bindLink(links[i], ctx);
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
