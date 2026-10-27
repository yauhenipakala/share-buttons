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

interface PopupNetwork {
    format: string;
    args: (c: ShareContext) => string[];
}

const merged = ({ title, desc }: ShareContext) => mergeForTitle([title, desc]);

/**
 * Networks shared through a popup window, keyed by `data-id`.
 */
export const POPUP_NETWORKS: Record<PopupNetworkId, PopupNetwork> = {
    fb: {
        format: 'https://www.facebook.com/sharer/sharer.php?u={0}&quote={1}',
        args: (c) => [c.url, c.title],
    },
    vk: {
        format: 'https://vk.com/share.php?url={0}&title={1}',
        args: (c) => [c.url, merged(c)],
    },
    tw: {
        format: 'https://twitter.com/intent/tweet?url={0}&text={1}',
        args: (c) => [c.url, merged(c)],
    },
    tg: {
        format: 'https://t.me/share/url?url={0}&text={1}',
        args: (c) => [c.url, merged(c)],
    },
    pk: {
        format: 'https://getpocket.com/edit?url={0}&title={1}',
        args: (c) => [c.url, merged(c)],
    },
    re: {
        format: 'https://reddit.com/submit?url={0}&title={1}',
        args: (c) => [c.url, c.title],
    },
    ev: {
        format: 'https://www.evernote.com/clip.action?url={0}&t={1}',
        args: (c) => [c.url, c.title],
    },
    in: {
        format: 'https://www.linkedin.com/shareArticle?mini=true&url={0}&title={1}&summary={2}&source={0}',
        args: (c) => [c.url, c.title, merged(c)],
    },
    pi: {
        format: 'https://pinterest.com/pin/create/button/?url={0}&media={0}&description={1}',
        args: (c) => [c.url, merged(c)],
    },
    wa: {
        format: 'https://wa.me/?text={0}%20{1}',
        args: (c) => [merged(c), c.url],
    },
    ok: {
        format: 'https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&service=odnoklassniki&st.shareUrl={0}',
        args: (c) => [c.url],
    },
    tu: {
        format: 'https://www.tumblr.com/widgets/share/tool?posttype=link&title={0}&caption={0}&content={1}&canonicalUrl={1}&shareSource=tumblr_share_button',
        args: (c) => [merged(c), c.url],
    },
    hn: {
        format: 'https://news.ycombinator.com/submitlink?t={0}&u={1}',
        args: (c) => [merged(c), c.url],
    },
    xi: {
        format: 'https://www.xing.com/app/user?op=share;url={0};title={1}',
        args: (c) => [c.url, merged(c)],
    },

    /**
     * Docs: https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/share-to-teams-from-web-apps?tabs=method2#example
     */
    mst: {
        format: 'https://teams.microsoft.com/share?href={0}&assignTitle={1}&msgText={2}',
        args: (c) => [c.url, c.title, c.desc],
    },
};

export function isPopupNetwork(id: string): id is PopupNetworkId {
    return Object.prototype.hasOwnProperty.call(POPUP_NETWORKS, id);
}
