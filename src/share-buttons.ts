import { HANDLERS, REQUIREMENTS, isShareId, type ShareContext } from './handlers';
import { NOT_SUPPORTED_MESSAGE, log } from './utils';

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
 * Raw share values, encoded only when a link is clicked
 */
interface ShareValues {
    url: string;
    title: string;
    desc: string;
}

/**
 * Method for getting url, title and description from the container or the page
 */
function getValues(share: Element): ShareValues {
    const metaDesc = document.querySelector('meta[name=description]');

    return {
        url: share.getAttribute('data-url') || window.location.href || ' ',
        title: share.getAttribute('data-title') || document.title || ' ',
        desc: share.getAttribute('data-desc') || (metaDesc && metaDesc.getAttribute('content')) || ' ',
    };
}

/**
 * Method for handling chosen links
 */
function share(id: string, values: ShareValues): void {
    const ctx: ShareContext = {
        url: encodeURIComponent(values.url),
        title: encodeURIComponent(values.title),
        desc: encodeURIComponent(values.desc),
    };

    if (isShareId(id)) {
        HANDLERS[id](ctx);
    }
}

/**
 * Method for attaching the click handler to the link, replacing a previously attached one
 */
function bindLink(el: Element, values: ShareValues): void {
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

    listeners[ref] = () => share(id, values);
    el.addEventListener('click', listeners[ref]);
}

/**
 * Method for initialize all links of the container
 */
function initForElement(el: Element): void {
    const links = el.querySelectorAll('a');
    const values = getValues(el);

    for (let i = links.length; i--;) {
        bindLink(links[i], values);
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

    // Hide links whose browser API is missing
    for (const [id, logTag, api] of REQUIREMENTS) {
        if (!window.navigator[api]) {
            const links = document.querySelectorAll<HTMLElement>('[data-id="' + id + '"]');
            for (let i = links.length; i--;) {
                links[i].style.display = 'none';
            }
            log(logTag + NOT_SUPPORTED_MESSAGE);
        }
    }
}

// start
update();
