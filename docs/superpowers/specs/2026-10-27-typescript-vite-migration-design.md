# TypeScript + Vite migration — design

Date: 2026-10-27
Status: Approved (pending written-spec review)
Target release: **share-buttons 2.0.0**

## Goal

Rewrite the library source in TypeScript and replace the Gulp toolchain with Vite, while
keeping the library's public behavior identical for every supported browser.

"Same lib, typed source": consumers keep using the same file, the same CDN URL, the same
HTML attributes and the same `ShareButtons.update()` API. TypeScript users additionally get
type declarations.

## Decisions

| Topic | Decision |
|---|---|
| Browser baseline | ES2015+. **IE support is dropped** (README updated). |
| Version | 2.0.0 (dropping IE is breaking for IE users). |
| Tooling | Vite for library build and demo site; Vitest + jsdom for tests; `tsc` for type checking only. |
| Source layout | Multiple `.ts` modules in `src/`, bundled into a **single** output file. |
| Output formats | UMD only. No ESM build. |
| Types | Single bundled `dist/share-buttons.d.ts`. |
| `dist/` in git | Still committed. |

## Constraints (must not change)

- Output path `dist/share-buttons.js`; `package.json` `main` unchanged.
- jsDelivr URL `//cdn.jsdelivr.net/npm/share-buttons/dist/share-buttons.js` keeps working.
- UMD global name `ShareButtons`; `window.ShareButtons.update()` and
  `require('share-buttons').update()` both work.
- Auto-initialization on script load.
- HTML contract: `.share-btn` container; `data-url`, `data-title`, `data-desc` on the
  container; `data-id` on child `<a>` elements; `data-sharebtn-ref` used internally.
- Every generated share URL is byte-identical to the current implementation, including the
  `stringFormat` quirk where an empty argument leaves the literal `{n}` placeholder.
- Demo deploy keeps serving the library at `site/js/share-buttons.min.js`.
- Minified gzip size of `dist/share-buttons.js` is ≤ the current file's.

## Deliberate behavior changes

1. IE `attachEvent` / `detachEvent` fallbacks removed.
2. Bug fix: the WebShare error path currently calls `log(SHARE_LOG_TAG + 'Error', err)` with a
   one-argument `log`, so `err` is dropped. It will be logged.

No other behavior changes.

## Source architecture

```
src/
  networks.ts       NetworkId union + table of popup networks (template + arg builder)
  actions.ts        mail / print / copy / share actions, popupCenter, stringFormat helpers
  share-buttons.ts  entry: DOM scan, listener binding, feature-detect hiding, auto-init, export update()
```

### `networks.ts`

- `type PopupNetworkId = 'fb' | 'vk' | 'tw' | 'tg' | 'pk' | 're' | 'ev' | 'in' | 'pi' | 'wa' | 'ok' | 'tu' | 'hn' | 'xi' | 'mst'`.
- `interface ShareContext { url: string; title: string; desc: string }` — all values already
  URI-encoded.
- `const POPUP_NETWORKS: Record<PopupNetworkId, { format: string; args: (c: ShareContext) => string[] }>`
  replacing the 15 popup cases of the current `switch`. Each entry reproduces the existing
  argument list exactly (e.g. `wa` → `[merge(title, desc), url]`, `ok` → `[url]`,
  `in` → `[url, title, merge(title, desc)]`, `mst` → `[url, title, desc]`).
- Pure: no DOM or `window` access.

### `actions.ts`

- `stringFormat(str, args)` and `mergeForTitle(texts)` — unchanged semantics
  (`args[n] || m`, join with `' - '`).
- `popupCenter(url)` — same window geometry and feature string as today.
- `mail(ctx)`, `print()`, `copy(ctx)`, `share(ctx)` — same logic as the current `switch`
  cases for `mail`, `print`, `copy`, `share`.
- `type ActionId = 'mail' | 'print' | 'copy' | 'share'`.

### `share-buttons.ts`

- `runShare(id: string, raw: {url, title, desc})`: encodes values, dispatches to
  `POPUP_NETWORKS` (then `popupCenter`) or to an action; unknown ids are ignored (as today's
  `default: break`).
- Reads `url` / `title` / `desc` with the same fallbacks: container attribute →
  `location.href` / `document.title` / `meta[name=description]` content → `' '`.
- Listener binding keeps the `data-sharebtn-ref` + module-level cache so repeated `update()`
  calls replace, not duplicate, handlers. IE branches removed.
- Hides `[data-id="copy"]` when `navigator.clipboard` is missing and `[data-id="share"]` when
  `navigator.canShare` is missing, logging the same messages.
- Runs initialization once at module evaluation.
- `export function update(): void` — the only export.

## Build and packaging

### `vite.config.mts` (library)

- `build.lib`: entry `src/share-buttons.ts`, `formats: ['umd']`, `name: 'ShareButtons'`,
  `fileName: () => 'share-buttons.js'`.
- `build.target: 'es2015'`, minified, no sourcemap, `outDir: 'dist'`.
- `vite-plugin-dts` with a `beforeWriteFile` hook: keep only the entry's declarations as
  `dist/share-buttons.d.ts` (self-contained, since the entry exports only `update(): void`),
  append `export as namespace ShareButtons;`, drop all other files. (`rollupTypes` was renamed
  `bundleTypes` in v5 and needs `@microsoft/api-extractor`; avoided.)
- Configs use `.mts` because `package.json` must not set `"type": "module"` (that would make
  Node load the UMD `dist/share-buttons.js` as ESM and break `require`).
- Vitest config lives here too: `test.environment: 'jsdom'`, `test.include: ['test/**/*.test.ts']`.

### `vite.demo.config.mts` (demo site)

- `root: 'demo'`, `build.outDir: '../site'`, `base: './'`, `emptyOutDir: true`.
- Inline plugin:
  - copies `dist/share-buttons.js` to `site/js/share-buttons.min.js`;
  - rewrites the demo's `<script src="../dist/share-buttons.js">` to `js/share-buttons.min.js`
    and keeps it a classic (non-module) script so the demo exercises the published UMD file;
  - replaces `<!-- ANALYTICS HERE -->` with `ANALYTICS` from `loadEnv(mode, process.cwd(), '')`
    (works with local `.env` and the CI secret);
  - in dev (`vite serve`), applies the same script-src rewrite and serves
    `dist/share-buttons.js` at `/js/share-buttons.min.js` via dev-server middleware;
  - minifies HTML (build only) with `html-minifier-terser` (collapse whitespace, remove comments, minify
    inline CSS/JS — same options as the current Gulp task).
- CSS and images are handled by Vite (hashed asset names are acceptable).

### `tsconfig.json`

`strict: true`, `target: "ES2015"`, `lib: ["ES2015", "DOM"]`, `module: "ESNext"`,
`moduleResolution: "Bundler"`, `noEmit: true`; includes `src`, `test`, and the Vite configs.

### `package.json`

- `version: "2.0.0"`, `main: "dist/share-buttons.js"` (unchanged),
  `types: "dist/share-buttons.d.ts"`, `files: ["dist"]`.
- Scripts:
  - `build:lib` — `vite build`
  - `build:demo` — `vite build -c vite.demo.config.mts`
  - `build` — `npm run build:lib && npm run build:demo`
  - `dev` — `concurrently "vite build --watch" "vite -c vite.demo.config.mts"`
  - `test` — `vitest run`
  - `typecheck` — `tsc`
- devDependencies removed: `gulp`, `gulp-htmlmin`, `gulp-rename`, `gulp-replace`,
  `gulp-uglify`, `dotenv`.
- devDependencies added: `vite`, `vite-plugin-dts`, `typescript`, `vitest`, `jsdom`,
  `html-minifier-terser`, `@types/html-minifier-terser`, `concurrently`.

### Files removed

`gulpfile.js`, `.npmignore`, `src/share-buttons.js`.

## Demo, examples, CI

- `example/dynamic.html`: script src changes from `../src/share-buttons.js` to
  `../dist/share-buttons.js`. `example/debug-mst.html` unchanged.
- `.github/workflows/deploy-demo.yml`: add `npm run typecheck` and `npm test` steps before
  `npm run build`. Everything else unchanged (`site/` output, revision stamp, FTP mirror).
- `README.md`: browser-support list updated to modern browsers (no IE); install/CDN/usage
  sections unchanged.

## Testing

Vitest + jsdom, tests in `test/`.

1. **Characterization tests** (`test/share-urls.test.ts`) — written and run against the
   current `src/share-buttons.js` **before** porting, then pointed at the TS source:
   - every popup network: exact URL passed to a mocked `window.open`, via inline snapshots,
     using fixtures that include empty values and characters needing encoding (`&`, spaces,
     Cyrillic);
   - `mail`: assigned `location.href`; `print`: `window.print` called; `copy`:
     `clipboard.writeText` receives decoded URL; `share`: `navigator.share` payload, and the
     rejection path logs `err` (expected to change from the old behavior — the one deliberate
     diff).
2. **Binding tests** — fallbacks to `document.title` / meta description / `location.href`;
   `update()` binds dynamically added buttons; calling `update()` twice does not double-fire;
   `copy` / `share` buttons hidden when unsupported.
3. **Bundle smoke test** — load built `dist/share-buttons.js` into jsdom as a classic script;
   assert `window.ShareButtons.update` exists and a click opens the expected URL.

### Release verification (manual)

- `npm run build`; compare gzip size of `dist/share-buttons.js` before vs after (after ≤ before),
  record both numbers.
- Serve `site/` locally and click through every button.
- `npm pack --dry-run` lists only `dist/share-buttons.js`, `dist/share-buttons.d.ts`,
  `README.md`, `LICENSE`, `package.json`.

## Out of scope

- ESM build or other output formats.
- Adding, removing or updating networks (e.g. Twitter → X, defunct Pocket).
- Changing the auto-init model or public API.
- Publishing to npm (prepared as 2.0.0; publishing is done by the maintainer).
