import { log, mergeForTitle, popupCenter, stringFormat } from './utils';

/**
 * Values that are shared
 */
export interface ShareContent {
    url: string;
    title: string;
    desc: string;
}

/**
 * What happens when a link with a given `data-id` is clicked, gets raw (not encoded) values
 */
export type ShareHandler = (data: ShareContent) => void;

const SHARE_LOG_TAG = 'navigator.share(): ';

/**
 * Indexes of the `{n}` placeholders in a link format, e.g. `'?u={0}&t={1}'` → `0 | 1`
 */
type Placeholders<F extends string> = F extends `${string}{${infer N extends number}}${infer Rest}`
    ? N | Placeholders<Rest>
    : never;

/**
 * Tuple with one string per placeholder index, e.g. `0 | 1` → `[string, string]`
 */
type ArgsFor<P extends number, T extends string[] = []> = [P] extends [never]
    ? T
    : ArgsFor<Exclude<P, T['length']>, [...T, string]>;

export type PopupArgs<F extends string> = ArgsFor<Placeholders<F>>;

/**
 * Share values encoded with encodeURIComponent, for putting into links
 */
function encodeAll({ url, title, desc }: ShareContent): ShareContent {
    return {
        url: encodeURIComponent(url),
        title: encodeURIComponent(title),
        desc: encodeURIComponent(desc),
    };
}

/**
 * Handler that opens the link format in a popup window,
 * `args` gets encoded values and must give exactly one value per `{n}` placeholder
 */
export const popup = <F extends string>(format: F, args: (c: ShareContent) => [...PopupArgs<F>]): ShareHandler =>
    (data) => popupCenter(stringFormat(format, args(encodeAll(data))));

/**
 * Handler that opens a link template with `{url}`, `{title}` and `{desc}` placeholders in a popup window
 */
const popupTemplate = (template: string): ShareHandler => (data) => {
    const encoded = encodeAll(data);
    popupCenter(template.replace(/\{(url|title|desc)\}/g, (m, key: keyof ShareContent) => encoded[key]));
};

const merged = ({ title, desc }: ShareContent) => mergeForTitle([title, desc]);
const urlTitle = (c: ShareContent): [string, string] => [c.url, c.title];
const urlMerged = (c: ShareContent): [string, string] => [c.url, merged(c)];
const mergedUrl = (c: ShareContent): [string, string] => [merged(c), c.url];

const xPost = popup('https://x.com/intent/tweet?url={0}&text={1}', urlMerged);

/**
 * Built-in handlers keyed by `data-id`
 */
const BUILT_IN = {
    fb: popup('https://www.facebook.com/sharer/sharer.php?u={0}&quote={1}', urlTitle),
    vk: popup('https://vk.com/share.php?url={0}&title={1}', urlMerged),
    tw: xPost,
    x: xPost,
    bs: popup('https://bsky.app/intent/compose?text={0}%20{1}', mergedUrl),
    th: popup('https://www.threads.com/intent/post?text={0}&url={1}', mergedUrl),
    tg: popup('https://t.me/share/url?url={0}&text={1}', urlMerged),
    re: popup('https://reddit.com/submit?url={0}&title={1}', urlTitle),
    ev: popup('https://www.evernote.com/clip.action?url={0}&t={1}', urlTitle),
    in: popup('https://www.linkedin.com/shareArticle?mini=true&url={0}&title={1}&summary={2}&source={0}', (c) => [c.url, c.title, merged(c)]),
    pi: popup('https://pinterest.com/pin/create/button/?url={0}&media={0}&description={1}', urlMerged),
    wa: popup('https://wa.me/?text={0}%20{1}', mergedUrl),
    ok: popup('https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&service=odnoklassniki&st.shareUrl={0}', (c) => [c.url]),
    tu: popup('https://www.tumblr.com/widgets/share/tool?posttype=link&title={0}&caption={0}&content={1}&canonicalUrl={1}&shareSource=tumblr_share_button', mergedUrl),
    hn: popup('https://news.ycombinator.com/submitlink?t={0}&u={1}', mergedUrl),
    xi: popup('https://www.xing.com/app/user?op=share;url={0};title={1}', urlMerged),

    /**
     * Docs: https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/share-to-teams-from-web-apps?tabs=method2#example
     */
    mst: popup('https://teams.microsoft.com/share?href={0}&assignTitle={1}&msgText={2}', (c) => [c.url, c.title, c.desc]),

    mail: (data) => {
        const { url, title, desc } = encodeAll(data);
        let text = title || desc || '';
        if (title.length > 0 && desc.length > 0) {
            text = mergeForTitle([title, desc]);
        }
        if (url.length > 0) {
            text = text + ' / ' + url;
        }

        window.location.href = stringFormat('mailto:?subject={0}&body={1}', [title, text]);
    },

    print: () => {
        window.print();
    },

    copy: ({ url }) => {
        window.navigator.clipboard.writeText(url);
    },

    share: ({ url, title, desc }) => {
        const text = mergeForTitle([title, desc]);

        window.navigator.share({ title: text, text, url })
            .catch((err) => {
                log(SHARE_LOG_TAG + 'Error', err);
            });
    },
} satisfies Record<string, ShareHandler>;

/**
 * Built-in `data-id` values
 */
export type ShareId = keyof typeof BUILT_IN;

/**
 * Built-in and registered handlers keyed by `data-id`
 */
const handlers: Record<string, ShareHandler> = BUILT_IN;

/**
 * Handlers that need a browser API, as `[data-id, log tag, required navigator property]`.
 * Links of an unsupported handler are hidden.
 */
export const REQUIREMENTS: ReadonlyArray<[id: ShareId, logTag: string, api: keyof Navigator]> = [
    ['copy', 'navigator.clipboard(): ', 'clipboard'],
    ['share', SHARE_LOG_TAG, 'canShare'],
];

/**
 * Add a network or replace a built-in one
 */
export function register(id: string, handler: string | ShareHandler): void {
    handlers[id] = typeof handler === 'string' ? popupTemplate(handler) : handler;
}

/**
 * Run the handler for `id`, returns false when there is none
 */
export function runHandler(id: string, data: ShareContent): boolean {
    if (!Object.prototype.hasOwnProperty.call(handlers, id)) {
        return false;
    }

    handlers[id](data);
    return true;
}
