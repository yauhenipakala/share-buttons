import fs from 'node:fs';
import { minify } from 'html-minifier-terser';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const LIB_FILE = 'dist/share-buttons.js';
const SITE_LIB_PATH = 'js/share-buttons.min.js';

// demo page loads the published UMD bundle as a classic script, like library users do
function shareButtonsDemo(analytics: string): Plugin {
  return {
    name: 'share-buttons-demo',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html
        .replace('../' + LIB_FILE, SITE_LIB_PATH)
        .replace('<!-- ANALYTICS HERE -->', analytics),
    },
    configureServer(server) {
      server.middlewares.use('/' + SITE_LIB_PATH, (_req, res) => {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(fs.readFileSync(LIB_FILE));
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: SITE_LIB_PATH, source: fs.readFileSync(LIB_FILE) });
    },
  };
}

const minifyHtml: Plugin = {
  name: 'share-buttons-demo-minify',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: (html) => minify(html, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
    }),
  },
};

export default defineConfig(({ mode }) => ({
  root: 'demo',
  base: './',
  build: {
    outDir: '../site',
    emptyOutDir: true,
    // keep stylesheets and images as files, as on the deployed site before
    assetsInlineLimit: 0,
  },
  plugins: [
    shareButtonsDemo(loadEnv(mode, process.cwd(), '').ANALYTICS ?? ''),
    minifyHtml,
  ],
}));
