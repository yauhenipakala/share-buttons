# Share Buttons [![npm](https://img.shields.io/npm/v/share-buttons.svg)](https://www.npmjs.com/package/share-buttons) ![license](https://img.shields.io/github/license/yauhenipakala/share-buttons.svg)

Simple, powerful, customizable and super lightweight (under 2 KB gzipped) social buttons for your site.

## [Demo](https://ypakala.com/demo/share-buttons/)

## Browser support

* Modern evergreen browsers: Chrome, Firefox, Safari, Edge
* Android
* iOS

Internet Explorer is not supported since v2.0.0 — use `share-buttons@1` if you need it.

**Copy to clipboard** requires the [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API#browser_compatibility)

**WebShare API** is only partially supported, see [browser compatibility for more information](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share#browser_compatibility)

## Install

### Available in NPM

```sh
npm i share-buttons
```

Import it in your bundle (ES module, types included):

```js
import { update, share, register } from 'share-buttons';
```

or include `share-buttons.js` in the end of page:

``` html
<script src="<path>/dist/share-buttons.js"></script>
```

### Getting the library from CDN

```html
<script src="//cdn.jsdelivr.net/npm/share-buttons/dist/share-buttons.js"></script>
```

Paste this HTML on the page:

``` html
<div class="share-btn">
    <a data-id="vk">VK</a>
    <a data-id="fb">Facebook</a>
    <a data-id="x">X</a>
    <a data-id="tg">Telegram</a>
    <a data-id="mail">EMail</a>
</div>
```

Added styles:

``` css
.share-btn > a {
    border: 1px solid #ccc;
    padding: 5px;
    font-size: 12px;
    font-family: Verdana, Arial;
}
.share-btn > a:hover {
    cursor: pointer;
}
```

Profit!!

## Share via

Network   | `data-id`
----------|---------
Facebook  | fb
VK        | vk
X (Twitter) | x or tw
Bluesky   | bs
Threads   | th
Telegram  | tg
Reddit    | re
Evernote  | ev
LinkedIn  | in
Pinterest | pi
WhatsApp  | wa
Odnoklassniki | ok
Tumblr    | tu
Hacker News | hn
Xing      | xi
Teams     | mst
EMail     | mail
Print     | print
Copy      | copy
WebShare API | share

Pocket (`pk`) was removed in v2.0.0: the service shut down in July 2025.

Links without `href` get `role="button"` and `tabindex="0"` (unless you set your own), so they can be reached with Tab and shared with Enter or Space.

## Customizing

Custom 'url', 'title', 'description':

``` html
<div class="share-btn" data-url="https://..." data-title="..." data-desc="...">
    <a data-id="vk">VK</a>
    <a data-id="fb">Facebook</a>
    <a data-id="x">X</a>
    <a data-id="tg">Telegram</a>
    <a data-id="mail">EMail</a>
</div>
```

Styles - full customization.

## API

Available as `window.ShareButtons` when loaded with a `<script>` tag, or as named exports of the `share-buttons` package.

### `update()`

Binds all `.share-btn` containers on the page. It runs once on load; call it again after adding buttons dynamically.

### `register(id, handler)`

Adds your own network, or replaces a built-in one. Works for buttons already on the page.

```js
// popup with a link template: {url}, {title} and {desc} are URL-encoded for you
ShareButtons.register('myNet', 'https://my.net/share?u={url}&t={title}&d={desc}');

// any action, gets the raw values
ShareButtons.register('log', ({ url, title, desc }) => console.log(url, title, desc));
```

``` html
<a data-id="myNet">My network</a>
```

### `share(id, data?)`

Shares from your own code, without `.share-btn` markup. Missing values fall back to the page's URL, title and meta description. Returns `false` when `id` is unknown.

```js
ShareButtons.share('x', { url: 'https://example.com', title: 'Look at this' });
```

### TypeScript

Types ship with the package: `ShareId` (built-in ids), `ShareContent` (`{ url, title, desc }`) and `ShareHandler`. With the `<script>` tag, the global `ShareButtons` is typed too.

## Examples

If you are using [Font-Awesome](https://github.com/FortAwesome/Font-Awesome):

```html
<div class="share-btn" data-url="https://..." data-title="..." data-desc="...">
    <a data-id="vk"><i class="fab fa-vk"></i> VK</a>
    <a data-id="fb"><i class="fab fa-square-facebook"></i> Facebook</a>
    <a data-id="x"><i class="fab fa-x-twitter"></i> X</a>
    <a data-id="tg"><i class="fab fa-telegram"></i> Telegram</a>
    <a data-id="mail"><i class="fas fa-at"></i> EMail</a>
</div>
```

You can also use [simple-icons](https://github.com/simple-icons/simple-icons).


----

&copy; 2015+ Yauheni Pakala and [contributors](https://github.com/yauhenipakala/share-buttons/graphs/contributors) | MIT
