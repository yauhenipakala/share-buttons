/**
 * Built-in handlers keyed by `data-id`
 */
declare const BUILT_IN: {
    fb: ShareHandler;
    vk: ShareHandler;
    tw: ShareHandler;
    bs: ShareHandler;
    th: ShareHandler;
    tg: ShareHandler;
    re: ShareHandler;
    in: ShareHandler;
    pi: ShareHandler;
    wa: ShareHandler;
    ok: ShareHandler;
    tu: ShareHandler;
    hn: ShareHandler;
    xi: ShareHandler;
    /**
     * Docs: https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/share-to-teams-from-web-apps?tabs=method2#example
     */
    mst: ShareHandler;
    mail: (data: ShareContent) => void;
    print: () => void;
    copy: ({ url }: ShareContent) => void;
    share: ({ url, title, desc }: ShareContent) => void;
};

/**
 * Add a network or replace a built-in one
 */
export declare function register(id: string, handler: string | ShareHandler): void;

/**
 * Share from code, without `.share-btn` markup. Missing values fall back to the page's url, title and meta description.
 * Returns false when no handler is known for `id`.
 */
export declare function share(id: ShareId | (string & {}), data?: Partial<ShareContent>): boolean;

/**
 * Values that are shared
 */
export declare interface ShareContent {
    url: string;
    title: string;
    desc: string;
}

/**
 * What happens when a link with a given `data-id` is clicked, gets raw (not encoded) values
 */
export declare type ShareHandler = (data: ShareContent) => void;

/**
 * Built-in `data-id` values
 */
export declare type ShareId = keyof typeof BUILT_IN;

/**
 * Initialize (or re-initialize) share buttons on the page.
 */
export declare function update(): void;

export { }

export as namespace ShareButtons;
