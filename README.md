# Share Buttons [![npm](https://img.shields.io/npm/v/share-buttons.svg)](https://www.npmjs.com/package/share-buttons) ![license](https://img.shields.io/github/license/wcoder/share-buttons.svg)

Simple, powerful, customizable and super lightweight (1 Kb Gzip) social buttons for your site.

## [Demo](https://ypakala.com/demo/share-buttons/)

## Browser support

* Google Chrome
* Mozilla Firefox 3.5+
* Opera 10+
* Safari 3.2+
* IE 8+
* Android
* iOS

**Copy to clipboard** is not supported on IE, see [browser compatibility for more information](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share#browser_compatibility)

**WebShare API** is only partially supported, see [browser compatibility for more information](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share#browser_compatibility)

## Install

### Available in NPM

```sh
npm i share-buttons
```

include `share-buttons.js` in the end of page:

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
    <a data-id="tw">Twitter</a>
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
Twitter   | tw
Telegram  | tg
Pocket    | pk
Reddit    | re
Evernote  | ev
LinkedIn  | in
Pinterest | pi
Skype     | sk
WhatsApp  | wa
Odnoklassniki | ok
Tumblr    | tu
Hacker News | hn
Xing      | xi
EMail     | mail
Print     | print
Copy      | copy
WebShare API | share

## Customizing

Custom 'url', 'title', 'description':

``` html
<div class="share-btn" data-url="https://..." data-title="..." data-desc="...">
    <a data-id="vk">VK</a>
    <a data-id="fb">Facebook</a>
    <a data-id="tw">Twitter</a>
    <a data-id="tg">Telegram</a>
    <a data-id="mail">EMail</a>
</div>
```

Styles - full customization.

## Examples

If you are using [Font-Awesome](https://github.com/FortAwesome/Font-Awesome):

```html
<div class="share-btn" data-url="https://..." data-title="..." data-desc="...">
    <a data-id="vk"><i class="fab fa-vk"></i> VK</a>
    <a data-id="fb"><i class="fab fa-facebook-square"></i> Facebook</a>
    <a data-id="tw"><i class="fab fa-twitter"></i> Twitter</a>
    <a data-id="tg"><i class="fab fa-telegram"></i> Telegram</a>
    <a data-id="mail"><i class="fas fa-at"></i> EMail</a>
</div>
```

You can also use [simple-icons](https://github.com/simple-icons/simple-icons).


----

&copy; 2015+ Yauheni Pakala and [contributors](https://github.com/wcoder/share-buttons/graphs/contributors) | MIT
