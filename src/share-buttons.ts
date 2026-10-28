import { REQUIREMENTS, register, runHandler, type ShareContent, type ShareHandler, type ShareId } from './handlers';
import { NOT_SUPPORTED_MESSAGE, log } from './utils';

export { register };
export type { ShareContent, ShareHandler, ShareId };

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
 * Method for getting url, title and description from the given values or the page
 */
function getValues(given: { [K in keyof ShareContent]?: string | null }): ShareContent {
  const metaDesc = document.querySelector('meta[name=description]');

  return {
    url: given.url || window.location.href || ' ',
    title: given.title || document.title || ' ',
    desc: given.desc || (metaDesc && metaDesc.getAttribute('content')) || ' ',
  };
}

/**
 * Share from code, without `.share-btn` markup. Missing values fall back to the page's url, title and meta description.
 * Returns false when no handler is known for `id`.
 */
export function share(id: ShareId | (string & {}), data: Partial<ShareContent> = {}): boolean {
  return runHandler(id, getValues(data));
}

/**
 * Method for attaching the click (and, for links without href, Enter/Space) handler to the link,
 * replacing a previously attached one
 */
function bindLink(el: Element, values: ShareContent): void {
  const id = el.getAttribute('data-id');
  if (!id) {
    return;
  }

  let ref = el.getAttribute(REF_ATTRIBUTE);
  if (ref) {
    el.removeEventListener('click', listeners[ref]);
    el.removeEventListener('keydown', listeners[ref]);
  } else {
    ref = String(++refCounter);
    el.setAttribute(REF_ATTRIBUTE, ref);
  }

  listeners[ref] = (event) => {
    if (event.type === 'keydown') {
      const key = (event as KeyboardEvent).key;
      if (key !== 'Enter' && key !== ' ') {
        return;
      }
      event.preventDefault();
    }
    runHandler(id, values);
  };
  el.addEventListener('click', listeners[ref]);

  // Without href a link is neither focusable nor announced as clickable
  if (!el.hasAttribute('href')) {
    if (!el.hasAttribute('role')) {
      el.setAttribute('role', 'button');
    }
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '0');
    }
    el.addEventListener('keydown', listeners[ref]);
  }
}

/**
 * Method for initialize all links of the container
 */
function initForElement(el: Element): void {
  const links = el.querySelectorAll('a');
  const values = getValues({
    url: el.getAttribute('data-url'),
    title: el.getAttribute('data-title'),
    desc: el.getAttribute('data-desc'),
  });

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

// start, skipped during server-side rendering
if (typeof document !== 'undefined') {
  update();
}
