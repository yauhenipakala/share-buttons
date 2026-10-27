import { mergeForTitle } from './actions';

/**
 * Share values, already encoded with encodeURIComponent.
 */
export interface ShareContext {
    url: string;
    title: string;
    desc: string;
}

export type PopupNetworkId = 'fb' | 'vk' | 'tw' | 'tg' | 'pk' | 're' | 'ev' | 'in' | 'pi' | 'wa' | 'ok' | 'tu' | 'hn' | 'xi' | 'mst';

/**
 * Link format and the builder of its `{n}` arguments
 */
type PopupNetwork = [format: string, args: (c: ShareContext) => string[]];

const merged = ({ title, desc }: ShareContext) => mergeForTitle([title, desc]);
const urlTitle = (c: ShareContext) => [c.url, c.title];
const urlMerged = (c: ShareContext) => [c.url, merged(c)];
const mergedUrl = (c: ShareContext) => [merged(c), c.url];

/**
 * Networks shared through a popup window, keyed by `data-id`.
 */
export const POPUP_NETWORKS: Record<PopupNetworkId, PopupNetwork> = {
    fb: [
        'https://www.facebook.com/sharer/sharer.php?u={0}&quote={1}',
        urlTitle,
    ],
    vk: [
        'https://vk.com/share.php?url={0}&title={1}',
        urlMerged,
    ],
    tw: [
        'https://twitter.com/intent/tweet?url={0}&text={1}',
        urlMerged,
    ],
    tg: [
        'https://t.me/share/url?url={0}&text={1}',
        urlMerged,
    ],
    pk: [
        'https://getpocket.com/edit?url={0}&title={1}',
        urlMerged,
    ],
    re: [
        'https://reddit.com/submit?url={0}&title={1}',
        urlTitle,
    ],
    ev: [
        'https://www.evernote.com/clip.action?url={0}&t={1}',
        urlTitle,
    ],
    in: [
        'https://www.linkedin.com/shareArticle?mini=true&url={0}&title={1}&summary={2}&source={0}',
        (c) => [c.url, c.title, merged(c)],
    ],
    pi: [
        'https://pinterest.com/pin/create/button/?url={0}&media={0}&description={1}',
        urlMerged,
    ],
    wa: [
        'https://wa.me/?text={0}%20{1}',
        mergedUrl,
    ],
    ok: [
        'https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&service=odnoklassniki&st.shareUrl={0}',
        (c) => [c.url],
    ],
    tu: [
        'https://www.tumblr.com/widgets/share/tool?posttype=link&title={0}&caption={0}&content={1}&canonicalUrl={1}&shareSource=tumblr_share_button',
        mergedUrl,
    ],
    hn: [
        'https://news.ycombinator.com/submitlink?t={0}&u={1}',
        mergedUrl,
    ],
    xi: [
        'https://www.xing.com/app/user?op=share;url={0};title={1}',
        urlMerged,
    ],

    /**
     * Docs: https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/share-to-teams-from-web-apps?tabs=method2#example
     */
    mst: [
        'https://teams.microsoft.com/share?href={0}&assignTitle={1}&msgText={2}',
        (c) => [c.url, c.title, c.desc],
    ],
};

export function isPopupNetwork(id: string): id is PopupNetworkId {
    return Object.prototype.hasOwnProperty.call(POPUP_NETWORKS, id);
}
