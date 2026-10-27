# TypeScript + Vite Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `share-buttons` to TypeScript and replace Gulp with Vite/Vitest, shipping 2.0.0 with identical behavior on ES2015+ browsers.

**Architecture:** Characterization tests are written first against the legacy `src/share-buttons.js` and frozen as snapshots. The source is then rewritten as three TS modules (`networks.ts`, `actions.ts`, `share-buttons.ts`) that Vite bundles into the same single UMD file `dist/share-buttons.js`, plus one `dist/share-buttons.d.ts`. A second Vite config builds the demo site into `site/`, replacing the Gulp demo pipeline.

**Tech Stack:** TypeScript 6, Vite 8 (library mode, UMD), vite-plugin-dts 5, Vitest 5 + jsdom 30, html-minifier-terser 7, concurrently 10. Node 24.

**Spec:** `docs/superpowers/specs/2026-10-27-typescript-vite-migration-design.md`

## Global Constraints

- devDependency floors: `vite ^8.3.5`, `vitest ^5.0.5`, `jsdom ^30.1.3`, `typescript ^6.0.3`, `vite-plugin-dts ^5.1.2`, `@types/node ^24.19.2`, `html-minifier-terser ^7.2.0`, `@types/html-minifier-terser ^7.0.2`, `concurrently ^10.0.6`.
- Node version stays `24` (`.node-version`).
- `package.json` must **not** get `"type": "module"`. If it did, Node would load the UMD `dist/share-buttons.js` as ESM and `require('share-buttons')` would break. All Vite configs therefore use `.mts`.
- Output: one file, `dist/share-buttons.js`, UMD, global name `ShareButtons`, `build.target: 'es2015'`, minified, no sourcemap. Its only export is `update(): void`.
- Types: one file, `dist/share-buttons.d.ts`, with no `import` statements and ending with `export as namespace ShareButtons;`.
- Size: `gzip -9` of `dist/share-buttons.js` must be ≤ **1738 bytes** (v1.10.0 baseline: 4112 bytes raw, 1738 gzip -9).
- Generated share URLs must be byte-identical to v1.10.0. Snapshots created in Task 1 must never be regenerated (`-u`) in later tasks.
- Only two deliberate behavior changes: the IE `attachEvent`/`detachEvent` paths are removed, and the WebShare rejection logs `err`.
- `stringFormat` keeps `args[n] || m` semantics exactly. A falsy argument (`''` or `0`) leaves the literal `{n}` in place.
- Read `window.location` and `window.navigator` at call time. Never cache them in module-level constants, or the test stubs won't take effect.
- Not in scope: an ESM build, network changes, changes to the auto-init model, publishing to npm.
- `site/` is gitignored and never committed. `dist/` is committed.

## Deviations from spec (verified by probe, 2026-10-27)

- Spec names `vite.config.ts` / `vite.demo.config.ts`. These become **`vite.config.mts` / `vite.demo.config.mts`** because of the `"type"` constraint above.
- Spec names `vite-plugin-dts` `rollupTypes: true`. In v5 that option was renamed to `bundleTypes` and needs `@microsoft/api-extractor`. Instead, use `beforeWriteFile`: rename the entry's `share-buttons.d.ts` output, append the namespace line, and return `false` for every other file. The entry exports only `update(): void`, so its declaration file is already self-contained.

## Review Focus

1. **Clicking an icon inside the link** (`<a data-id="fb"><i class="fab fa-facebook"></i> Facebook</a>`), the README's main usage. The click must still share. Test: Task 1 `binding.test.ts` › "click on nested icon shares".
2. **Popup blocked** (`window.open` returns `null`). Must not throw. Test: every popup test mocks `open` to return `null`, plus Task 1 "blocked popup does not throw".
3. **User cancels native share** (`navigator.share` rejects with `AbortError`). Must log, with no unhandled rejection. Test: Task 1/2 "share rejection logs err".
4. **TypeScript consumer using the global script.** `window.ShareButtons.update()` must type-check from the `.d.ts` alone. Test: Task 3 `bundle.test.ts` › "declarations are a single self-contained file".
5. **CommonJS consumer** (`require('share-buttons')`). Must still get `update`, and the package must not become ESM. Test: Task 3 `bundle.test.ts` › "exposes update via CommonJS" and "package stays CommonJS-compatible".

---

### Task 1: Test harness + characterization tests against the legacy JS

**Files:**
- Modify: `package.json` (add devDeps `vitest`, `jsdom`, `typescript`, `@types/node`; scripts `"test": "vitest run"`, `"typecheck": "tsc"`; keep the existing `build` script)
- Create: `tsconfig.json`
- Create: `vite.config.mts` (test config only for now)
- Create: `test/helpers.ts`
- Create: `test/share-urls.test.ts`, `test/binding.test.ts` (+ generated `test/__snapshots__/share-urls.test.ts.snap`)

**Interfaces:**
- Produces (`test/helpers.ts`), used by every later test:
  - `FIXTURE_FULL: { url: 'https://example.com/page?a=1&b=2'; title: 'Hello & welcome'; desc: 'Привет мир' }`
  - `POPUP_IDS = ['fb','vk','tw','tg','pk','re','ev','in','pi','wa','ok','tu','hn','xi','mst'] as const`
  - `PAGE_HREF = 'https://page.example/'`
  - `mount(html: string): void`: sets `document.body.innerHTML`.
  - `shareBlock(attrs: Partial<{url: string; title: string; desc: string}>, ids: string[]): string`: returns `<div class="share-btn" data-url=… data-title=… data-desc=…>` with one `<a data-id="…">` per id. Attributes that are omitted are left off entirely.
  - `stubBrowser(opts?: { clipboard?: boolean; share?: boolean }): { open; print; log; location: { href: string }; writeText; share }`. It calls `vi.spyOn(window, 'open').mockReturnValue(null)`, `vi.spyOn(window, 'print').mockImplementation(() => {})`, `vi.spyOn(console, 'log').mockImplementation(() => {})`, `vi.stubGlobal('location', { href: PAGE_HREF })`, and `vi.stubGlobal('navigator', { ...(clipboard && { clipboard: { writeText } }), ...(share && { canShare: vi.fn(() => true), share }) })` with `share = vi.fn().mockResolvedValue(undefined)`.
  - `loadShareButtons(): Promise<{ update(): void }>`: `vi.resetModules()` then `import('../src/share-buttons.js')`, with a `// @ts-ignore legacy untyped JS (removed in Task 2)`. The probe confirmed that Vitest takes the UMD's CommonJS branch, so the import's namespace contains `update`.
  - `click(selector: string): void`: `document.querySelector<HTMLElement>(selector)!.click()`.
- `afterEach` (in `vite.config.mts` `test.setupFiles` or per-file): `vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = ''; document.title = ''; document.head.innerHTML = ''`.

- [ ] **Step 1: Install and configure**

`npm i -D vitest@^5.0.5 jsdom@^30.1.3 typescript@^6.0.3 @types/node@^24.19.2`.

`tsconfig.json`: `strict: true`, `target: "ES2015"`, `lib: ["ES2015", "DOM"]`, `module: "ESNext"`, `moduleResolution: "Bundler"`, `noEmit: true`, `skipLibCheck: true`, `types: ["node"]`, `include: ["src", "test", "*.mts"]`.

`vite.config.mts`: `defineConfig({ test: { environment: 'jsdom', include: ['test/**/*.test.ts'], setupFiles: ['test/setup.ts'] } })`, with `test/setup.ts` holding the `afterEach` above. Import `defineConfig` from `vitest/config`.

- [ ] **Step 2: Write `test/share-urls.test.ts`**

Each test: `stubBrowser(...)`, `mount(shareBlock(FIXTURE_FULL, [id]))`, `await loadShareButtons()`, `click('[data-id="<id>"]')`.

- `it.each(POPUP_IDS)('popup %s url', …)`: `expect(open).toHaveBeenCalledTimes(1)`; `expect(open.mock.calls[0][0]).toMatchSnapshot()`; `expect(open.mock.calls[0][1]).toBe('')`.
- `'popup window features'` (fb): `expect(open.mock.calls[0][2]).toMatchSnapshot()`.
- `'mail url'`: `expect(location.href).toMatchSnapshot()`.
- `'mail url with fallback values'`: mount `shareBlock({}, ['mail'])` with no title/meta, then `expect(location.href).toMatchSnapshot()`.
- `'print'`: `expect(print).toHaveBeenCalledTimes(1)`; `expect(open).not.toHaveBeenCalled()`.
- `'copy'` (`clipboard: true`): `expect(writeText).toHaveBeenCalledWith('https://example.com/page?a=1&b=2')`.
- `'share'` (`share: true`): `expect(share).toHaveBeenCalledWith({ title: 'Hello & welcome - Привет мир', text: 'Hello & welcome - Привет мир', url: 'https://example.com/page?a=1&b=2' })`.
- `it.fails('share rejection logs err', …)` (`share: true`, `share.mockRejectedValue(err)` with `err = new DOMException('cancel', 'AbortError')`): after `await vi.waitFor(() => expect(log).toHaveBeenCalledWith('navigator.share(): Error', err))`. This fails on v1.10.0 because `err` is dropped. The comment says Task 2 flips it to `it`.

- [ ] **Step 3: Write `test/binding.test.ts`**

- `'falls back to location, document.title and meta description'`: `document.title = 'Doc Title'`, add `<meta name="description" content="Meta desc">` to head, mount `shareBlock({}, ['in'])`, click. `expect(open.mock.calls[0][0]).toBe('https://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fpage.example%2F&title=Doc%20Title&summary=Doc%20Title - Meta%20desc&source=https%3A%2F%2Fpage.example%2F')`.
- `'falls back to a single space when nothing is set'`: mount `shareBlock({}, ['fb'])`. `expect(open.mock.calls[0][0]).toBe('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fpage.example%2F&quote=%20')`.
- `'each container uses its own data-url'`: two blocks with `data-url` `https://a.example/` and `https://b.example/`. Clicking the second block's `fb` opens a URL containing `u=https%3A%2F%2Fb.example%2F`.
- `'update() binds buttons added later'`: load with an empty `.share-btn`, append `<a data-id="fb">`, call `update()`, click → `open` called once.
- `'update() twice does not double-bind'`: load, then `update(); update();`, click → `toHaveBeenCalledTimes(1)`.
- `'click on nested icon shares'`: `<a data-id="fb"><i class="icon"></i> FB</a>`, then click the `<i>` → `open` called once.
- `'blocked popup does not throw'`: `open` returns `null` (the default); `expect(() => click('[data-id="fb"]')).not.toThrow()`.
- `'unknown data-id and links without data-id are ignored'`: `<a data-id="nope">` and `<a>`. Click both → no `open`, no `print`, no throw.
- `'hides copy and share when unsupported'`: `stubBrowser()` with no flags. Both `[data-id="copy"]` and `[data-id="share"]` have `style.display === 'none'`. `log` was called with `'navigator.clipboard(): This feature is not supported on this browser or operating system.'` and `'navigator.share(): This feature is not supported on this browser or operating system.'`.
- `'keeps copy and share when supported'`: `stubBrowser({ clipboard: true, share: true })` → `style.display === ''` for both.

- [ ] **Step 4: Run against the legacy JS and generate snapshots**

Run: `npx vitest run`
Expected: all pass (the `it.fails` test counts as passing). The snapshot file is written with 18 entries (15 popups + features + 2 mail).

- [ ] **Step 5: Review the snapshots by eye**

Open `test/__snapshots__/share-urls.test.ts.snap`. Check: `fb` is `https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fpage%3Fa%3D1%26b%3D2&quote=Hello%20%26%20welcome`. `wa` starts with `https://wa.me/?text=Hello%20%26%20welcome - %D0%9F…%20https%3A…`. The features string has `width=600,height=400`. These are the v1.10.0 contract.

- [ ] **Step 6: Typecheck and commit**

Run: `npm run typecheck`. Expected: exit 0.

```bash
git add package.json package-lock.json tsconfig.json vite.config.mts test
git commit -m "test: characterize v1.10.0 behavior with Vitest + jsdom"
```

---

### Task 2: Port the source to TypeScript modules

**Files:**
- Create: `src/networks.ts`, `src/actions.ts`, `src/share-buttons.ts`
- Delete: `src/share-buttons.js`
- Modify: `test/helpers.ts` (import `'../src/share-buttons'`, remove `@ts-ignore`, return type `typeof import('../src/share-buttons')`)
- Modify: `test/share-urls.test.ts` (change `it.fails` → `it` for "share rejection logs err")

**Interfaces:**
- Consumes: the Task 1 helpers and snapshots, unchanged.
- Produces:
  - `src/networks.ts`:
    - `interface ShareContext { url: string; title: string; desc: string }` (values are URI-encoded)
    - `type PopupNetworkId = 'fb'|'vk'|'tw'|'tg'|'pk'|'re'|'ev'|'in'|'pi'|'wa'|'ok'|'tu'|'hn'|'xi'|'mst'`
    - `const POPUP_NETWORKS: Record<PopupNetworkId, { format: string; args: (c: ShareContext) => string[] }>`
    - `isPopupNetwork(id: string): id is PopupNetworkId`
  - `src/actions.ts`:
    - `stringFormat(str: string, args: ReadonlyArray<string | number>): string`
    - `mergeForTitle(texts: string[]): string`
    - `log(...args: unknown[]): void`
    - `popupCenter(url: string): void`
    - `type ActionId = 'mail'|'print'|'copy'|'share'`
    - `const ACTIONS: Record<ActionId, (c: ShareContext) => void>`
    - `isAction(id: string): id is ActionId`
    - `const SHARE_LOG_TAG = 'navigator.share(): '`
    - `const NOT_SUPPORTED_MESSAGE = 'This feature is not supported on this browser or operating system.'`
  - `src/share-buttons.ts`: `export function update(): void`. This is the only export, and it runs once at module evaluation.

- [ ] **Step 1: Point the tests at the TS entry and flip the share-rejection test**

Edit `test/helpers.ts` and `test/share-urls.test.ts` as listed under Files. Run `npx vitest run`. Expected: exactly one FAIL, "share rejection logs err". The extensionless import still resolves to the legacy `.js`, which drops `err`. All other tests pass.

- [ ] **Step 2: Implement `src/networks.ts` and `src/actions.ts`**

Copy the `*_LINK_FORMAT` strings verbatim from `src/share-buttons.js` (including the `MST` doc comment). With `m = mergeForTitle([title, desc])`, the `args` table is:
`fb [url,title]`, `vk [url,m]`, `tw [url,m]`, `tg [url,m]`, `pk [url,m]`, `re [url,title]`, `ev [url,title]`, `in [url,title,m]`, `pi [url,m]`, `wa [m,url]`, `ok [url]`, `tu [m,url]`, `hn [m,url]`, `xi [url,m]`, `mst [url,title,desc]`.

`ACTIONS.mail`, `print`, `copy` and `share` port the legacy `switch` cases line for line. The one change: `share` logs with `log(SHARE_LOG_TAG + 'Error', err)`, which now prints both arguments because `log` is variadic. `popupCenter` keeps the legacy geometry and feature string and drops the unused `title` parameter.

- [ ] **Step 3: Implement `src/share-buttons.ts`; delete `src/share-buttons.js`**

Port `i()`, `initForElement`, `prepareLink`, `getUrl`/`getTitle`/`getDesc` and `hideAll` with the same fallbacks and the same log messages. Listener cache: module-level `let refCounter = 0` and `const listeners: Record<string, EventListener> = {}`, keyed by the `data-sharebtn-ref` attribute, with the IE branches dropped. Dispatch: encode `url`, `title` and `desc` with `encodeURIComponent`. If `isPopupNetwork(id)` → `popupCenter(stringFormat(n.format, n.args(ctx)))`, else if `isAction(id)` → `ACTIONS[id](ctx)`, otherwise do nothing. End the module with `update();`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run` (no `-u`).
Expected: all pass, 0 snapshots written or updated. If a snapshot mismatches, fix the source, never the snapshot.

- [ ] **Step 5: Typecheck and commit**

Run: `npm run typecheck`. Expected: exit 0.

```bash
git add -A src test
git commit -m "refactor: port share-buttons to TypeScript modules"
```

---

### Task 3: Library build with Vite, types, packaging

**Files:**
- Modify: `vite.config.mts` (add `build` + `plugins`)
- Modify: `package.json`: `version: "2.0.0"`, `types: "dist/share-buttons.d.ts"`, `files: ["dist"]`, scripts `"build:lib": "vite build"`, `"pretest": "npm run build:lib"`, `"build": "npm run build:lib && npx gulp build-demo"` (temporary until Task 4). Add devDep `vite-plugin-dts@^5.1.2`; add `vite@^8.3.5` explicitly.
- Delete: `.npmignore`
- Regenerate: `dist/share-buttons.js`; create `dist/share-buttons.d.ts`
- Test: `test/bundle.test.ts`

**Interfaces:**
- Consumes: `src/share-buttons.ts` › `update()`, plus the Task 1 helpers `stubBrowser`, `mount`, `shareBlock`, `FIXTURE_FULL`.
- Produces: `dist/share-buttons.js` (UMD) and `dist/share-buttons.d.ts`, both used by Task 4's demo build.

- [ ] **Step 1: Write `test/bundle.test.ts`**

Read `dist/share-buttons.js` and `.d.ts` with `fs.readFileSync`. `afterEach`: `delete (window as any).ShareButtons`.
- `'exposes window.ShareButtons when loaded as a classic script'`: stub, mount `shareBlock(FIXTURE_FULL, ['fb'])`, `new Function(src).call(window)`. `typeof window.ShareButtons.update === 'function'`. Click fb → `open.mock.calls[0][0] === 'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Fpage%3Fa%3D1%26b%3D2&quote=Hello%20%26%20welcome'`.
- `'exposes update via CommonJS'`: `const mod = { exports: {} as Record<string, unknown> }; new Function('exports', 'module', src).call(window, mod.exports, mod)` → `typeof mod.exports.update === 'function'`.
- `'package stays CommonJS-compatible'`: from parsed `package.json`, `type` is `undefined`, `main === 'dist/share-buttons.js'`, `types === 'dist/share-buttons.d.ts'`, `files` deep-equals `['dist']`.
- `'declarations are a single self-contained file'`: the d.ts contains `export declare function update(): void;` and `export as namespace ShareButtons;`, and does not match `/\bimport\b/`. `fs.readdirSync('dist').sort()` deep-equals `['share-buttons.d.ts', 'share-buttons.js']`.
- `'bundle is no larger than v1.10.0'`: `zlib.gzipSync(src, { level: 9 }).length <= 1738`.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run test/bundle.test.ts`. Note that `pretest` only runs through `npm test`.
Expected: FAIL. The current `dist` is the old uglified file, there is no `.d.ts`, and `package.json` checks fail.

- [ ] **Step 3: Configure the build**

In `vite.config.mts`, inside the existing `defineConfig`:
- `build: { target: 'es2015', sourcemap: false, emptyOutDir: true, lib: { entry: 'src/share-buttons.ts', formats: ['umd'], name: 'ShareButtons', fileName: () => 'share-buttons.js' } }`
- `plugins: [dts({ include: ['src'], beforeWriteFile })]`

`beforeWriteFile(filePath, content)` returns `{ filePath, content: content + '\nexport as namespace ShareButtons;\n' }` when `filePath` ends with `/share-buttons.d.ts`, and `false` otherwise.

Apply the `package.json` changes listed under Files and delete `.npmignore`.

- [ ] **Step 4: Build and run all tests**

Run: `npm test` (which runs `pretest` → `build:lib`).
Expected: Vite reports `dist/share-buttons.js` and dts output, and all tests in all files pass with 0 snapshot changes. Record the gzip size printed by the size test, or run `gzip -9c dist/share-buttons.js | wc -c`.

- [ ] **Step 5: Check package contents**

Run: `npm pack --dry-run 2>&1 | grep -E "^npm notice [0-9.]+[kB]* "`
Expected: exactly `LICENSE`, `README.md`, `dist/share-buttons.d.ts`, `dist/share-buttons.js`, `package.json`.

- [ ] **Step 6: Typecheck and commit**

```bash
npm run typecheck
git add -A package.json package-lock.json vite.config.mts dist test .npmignore
git commit -m "build: bundle library with Vite, ship type declarations, bump to 2.0.0"
```

---

### Task 4: Demo build with Vite; remove Gulp; CI, examples, README

**Files:**
- Create: `vite.demo.config.mts`
- Modify: `package.json`: scripts `"build:demo": "vite build -c vite.demo.config.mts"`, `"build": "npm run build:lib && npm run build:demo"`, `"dev": "concurrently \"vite build --watch\" \"vite -c vite.demo.config.mts\""`. Remove devDeps `gulp`, `gulp-htmlmin`, `gulp-rename`, `gulp-replace`, `gulp-uglify`, `dotenv`. Add `html-minifier-terser@^7.2.0`, `@types/html-minifier-terser@^7.0.2`, `concurrently@^10.0.6`.
- Delete: `gulpfile.js`
- Modify: `example/dynamic.html` (`../src/share-buttons.js` → `../dist/share-buttons.js`)
- Modify: `.github/workflows/deploy-demo.yml` (add steps `Typecheck: npm run typecheck` and `Test: npm test` between "Install dependencies" and "Build site")
- Modify: `README.md` › "Browser support" only
- Test: `test/demo-build.test.ts`

**Interfaces:**
- Consumes: `dist/share-buttons.js` from Task 3 (it exists because of `pretest`).
- Produces: `site/` containing `index.html`, `js/share-buttons.min.js`, and hashed CSS/images. CI uploads it unchanged.

- [ ] **Step 1: Write `test/demo-build.test.ts`**

Add `// @vitest-environment node` at the top. In `beforeAll` (timeout 30 s): set `process.env.ANALYTICS = '<meta name="analytics" content="probe">'`, create `outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-demo-'))`, then `await build({ configFile: 'vite.demo.config.mts', logLevel: 'silent', build: { outDir, emptyOutDir: true } })` (import `build` from `vite`). `afterAll`: delete `process.env.ANALYTICS` and remove `outDir`.
- `'uses the published bundle'`: `index.html` contains `src="js/share-buttons.min.js"` and does not contain `../dist/`. `js/share-buttons.min.js` is byte-equal to `dist/share-buttons.js`.
- `'injects analytics and minifies'`: `index.html` contains `content="probe"`, does not contain `<!--`, and is shorter than `demo/index.html` (proves minification ran).
- `'emits stylesheets referenced by the page'`: every `href` matching `/href="([^"]+\.css)"/g` exists under `outDir`.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run test/demo-build.test.ts`. Expected: FAIL, config file `vite.demo.config.mts` not found.

- [ ] **Step 3: Implement `vite.demo.config.mts`**

`defineConfig(({ mode }) => …)` with `root: 'demo'`, `base: './'`, `build: { outDir: '../site', emptyOutDir: true }`, and one inline plugin named `share-buttons-demo` that does the following:
- `transformIndexHtml: { order: 'pre', handler }`: replace `../dist/share-buttons.js` → `js/share-buttons.min.js`, and `<!-- ANALYTICS HERE -->` → `loadEnv(mode, process.cwd(), '').ANALYTICS ?? ''`.
- `configureServer(server)`: middleware that serves `dist/share-buttons.js` with `Content-Type: text/javascript` at `/js/share-buttons.min.js`.
- `generateBundle()` (build only): `this.emitFile({ type: 'asset', fileName: 'js/share-buttons.min.js', source: fs.readFileSync('dist/share-buttons.js') })`. Emitting an asset respects any `outDir` override.
- A second `transformIndexHtml: { order: 'post', handler }` hook, build only (`apply: 'build'` on a separate plugin object, or a check on `ctx.server`): `await minify(html, { collapseWhitespace: true, removeComments: true, minifyCSS: true, minifyJS: true })` from `html-minifier-terser`.

Keep the script tag classic (no `type="module"`). Vite leaves it alone, possibly with a warning, which is fine.

- [ ] **Step 4: Run all tests**

Run: `npm test`. Expected: all pass, 0 snapshot changes.

- [ ] **Step 5: Remove Gulp, update scripts, examples, CI, README**

Apply the `package.json` changes, delete `gulpfile.js`, and edit `example/dynamic.html` and the workflow as listed under Files.

Replace the README's "Browser support" bullet list and the "Copy to clipboard is not supported on IE" line with:

```markdown
* Modern evergreen browsers: Chrome, Firefox, Safari, Edge
* Android
* iOS

Internet Explorer is not supported since v2.0.0 — use `share-buttons@1` if you need it.

**Copy to clipboard** requires the [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API#browser_compatibility)
```

Keep the existing WebShare API line.

- [ ] **Step 6: Verify full build and dev server**

Run: `npm run build && ls site site/js && grep -c "share-buttons.min.js" site/index.html`
Expected: `site/index.html`, `site/js/share-buttons.min.js` and `site/assets/*` exist; the grep count is `1`.

Run: `npm run dev`, open the printed URL, confirm the buttons work (clicking `fb` opens a popup), then stop it.

Run: `npm run typecheck && git grep -n -i gulp -- . ':!docs' ':!package-lock.json'`. Expected: typecheck exit 0, and no grep matches.

- [ ] **Step 7: Commit**

```bash
git add -A package.json package-lock.json vite.demo.config.mts gulpfile.js example .github README.md test
git commit -m "build: replace Gulp demo pipeline with Vite; run typecheck and tests in CI"
```

---

### Task 5: Release verification

**Files:** none changed unless a check fails.

- [ ] **Step 1: Clean install and full run**

Run: `rm -rf node_modules && npm ci && npm run typecheck && npm test && npm run build`
Expected: every command exits 0, and `git status --porcelain` is empty (the committed `dist/` matches a fresh build).

- [ ] **Step 2: Record sizes**

Run: `wc -c dist/share-buttons.js && gzip -9c dist/share-buttons.js | wc -c`
Expected: gzip ≤ 1738. Report both numbers next to the v1.10.0 baseline (4112 / 1738) in the final summary.

- [ ] **Step 3: Manual click-through of the built site**

Run: `npx vite preview -c vite.demo.config.mts` and open the URL. Click every button: each popup network opens a window with the right domain, `mail` triggers a mailto, `print` opens the print dialog, and `copy`/`share` work or are hidden depending on browser support. No console errors except the "not supported" logs.

- [ ] **Step 4: Package contents**

Run: `npm pack --dry-run`. Expected: the same 5 files as in Task 3 Step 5.
