import { SHARE_LOG_TAG, log, mergeForTitle, popupCenter, stringFormat } from './utils';

/**
 * Share values, already encoded with encodeURIComponent.
 */
export interface ShareContext {
    url: string;
    title: string;
    desc: string;
}

/**
 * What happens when a link with a given `data-id` is clicked
 */
export type Handler = (c: ShareContext) => void;

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
 * Handler that opens the link format in a popup window,
 * `args` must give exactly one value per `{n}` placeholder
 */
export const popup = <F extends string>(format: F, args: (c: ShareContext) => [...PopupArgs<F>]): Handler =>
    (c) => popupCenter(stringFormat(format, args(c)));

const decode = (text: string) => decodeURIComponent(text);
const merged = ({ title, desc }: ShareContext) => mergeForTitle([title, desc]);
const urlTitle = (c: ShareContext): [string, string] => [c.url, c.title];
const urlMerged = (c: ShareContext): [string, string] => [c.url, merged(c)];
const mergedUrl = (c: ShareContext): [string, string] => [merged(c), c.url];

/**
 * Click handlers keyed by `data-id`
 */
export const HANDLERS = {
    fb: popup('https://www.facebook.com/sharer/sharer.php?u={0}&quote={1}', urlTitle),
    vk: popup('https://vk.com/share.php?url={0}&title={1}', urlMerged),
    tw: popup('https://twitter.com/intent/tweet?url={0}&text={1}', urlMerged),
    tg: popup('https://t.me/share/url?url={0}&text={1}', urlMerged),
    pk: popup('https://getpocket.com/edit?url={0}&title={1}', urlMerged),
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

    mail: ({ url, title, desc }) => {
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
        window.navigator.clipboard.writeText(decode(url));
    },

    share: ({ url, title, desc }) => {
        const text = decode(mergeForTitle([title, desc]));

        window.navigator.share({ title: text, text, url: decode(url) })
            .catch((err) => {
                log(SHARE_LOG_TAG + 'Error', err);
            });
    },
} satisfies Record<string, Handler>;

export type ShareId = keyof typeof HANDLERS;

/**
 * Handlers that need a browser API, as `[data-id, log tag, required navigator property]`.
 * Links of an unsupported handler are hidden.
 */
export const REQUIREMENTS: ReadonlyArray<[id: ShareId, logTag: string, api: keyof Navigator]> = [
    ['copy', 'navigator.clipboard(): ', 'clipboard'],
    ['share', SHARE_LOG_TAG, 'canShare'],
];

export function isShareId(id: string): id is ShareId {
    return {}.hasOwnProperty.call(HANDLERS, id);
}
