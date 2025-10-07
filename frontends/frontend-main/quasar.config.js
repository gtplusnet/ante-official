/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

const { configure } = require('quasar/wrappers');
const path = require('path');
const { visualizer } = require('rollup-plugin-visualizer');

module.exports = configure(function (/* ctx */) {
  // Memory optimization settings
  const memoryMode = process.env.MEMORY_MODE || 'standard'; // standard, low, minimal
  const isLowMemory = memoryMode === 'low' || memoryMode === 'minimal';
  const isMinimalMemory = memoryMode === 'minimal';

  console.log(`Starting in ${memoryMode} memory mode`);

  return {
    // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: ['sentry', 'axios', 'supabase', 'auth', 'multi-account', 'mixins', 'bus', 'lazy-components', 'theme', 'route-loading', 'google-auth'],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: ['app.scss'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v7',
      // 'fontawesome-v6', // Removed - replaced with SVG icons
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      'roboto-font', // optional, you are not bound to it
      'material-icons', // optional, you are not bound to it
      'material-icons-outlined', // optional, you are not bound to it
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
    build: {
      env: (() => {
        const dotenv = require('dotenv');
        const path = require('path');

        // Load .env file for local development (if exists)
        const result = dotenv.config({ path: path.resolve(__dirname, '.env') });

        // Merge with process.env (Vercel injects variables here)
        // process.env takes precedence over .env file
        return {
          ...(result.parsed || {}),
          ...Object.keys(process.env).reduce((acc, key) => {
            // Only include variables that are relevant to the frontend
            if (key.startsWith('VITE_') || key.startsWith('API_') ||
                key === 'ENVIRONMENT' || key === 'WHITELABEL' ||
                key === 'SOCKET_URL' || key.includes('SUPABASE')) {
              acc[key] = process.env[key];
            }
            return acc;
          }, {})
        };
      })(),
      target: {
        browser: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20',
      },

      vueRouterMode: 'hash', // available values: 'hash', 'history'
      // vueRouterBase,
      // vueDevtools,
      // vueOptionsAPI: false,

      // rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

      // publicPath: '/',
      // analyze: true,
      // env: {},
      rawDefine: {
        '__API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:3000'),
        '__ENVIRONMENT': JSON.stringify(process.env.ENVIRONMENT || 'development'),
        '__WHITELABEL': JSON.stringify(process.env.WHITELABEL || 'ante'),
        '__SOCKET_URL': JSON.stringify(process.env.VITE_SOCKET_URL || 'ws://localhost:4000'),
      },
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir

      extendViteConf() {
        return {
          resolve: {
            alias: {
              '@': path.resolve(__dirname, './src'),
              '@components': path.resolve(__dirname, './src/components'),
              '@layouts': path.resolve(__dirname, './src/layouts'),
              '@pages': path.resolve(__dirname, './src/pages'),
              '@stores': path.resolve(__dirname, './src/stores'),
              '@utils': path.resolve(__dirname, './src/utility'),
              '@interfaces': path.resolve(__dirname, './src/interfaces'),
              '@shared': path.resolve(__dirname, './src/shared'),
            },
          },
          build: {
            chunkSizeWarningLimit: 750,
            // Disable sourcemaps in low memory modes to save memory
            sourcemap: isLowMemory ? false : true,
            // TASK-005: Enable production optimizations
            minify: 'terser', // Use terser for better minification
            terserOptions: {
              compress: {
                drop_console: true, // Remove console.logs (also addresses TASK-006)
                drop_debugger: true, // Remove debugger statements
                pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
              },
              format: {
                comments: false, // Remove all comments
              },
            },
            // More aggressive code splitting in low memory mode
            rollupOptions: isLowMemory ? {
              output: {
                manualChunks: {
                  'vendor-vue': ['vue', 'vue-router', 'pinia'],
                  'vendor-quasar': ['quasar'],
                  'vendor-charts': ['apexcharts', 'vue3-apexcharts'],
                  'vendor-calendar': ['@fullcalendar/core', '@fullcalendar/vue3'],
                },
              },
            } : {},
          },
          // Add bundle analyzer plugin if ANALYZE=true (TASK-004)
          plugins: process.env.ANALYZE === 'true' ? [
            visualizer({
              filename: './dist/spa/stats.html',
              open: false,
              gzipSize: true,
              brotliSize: true,
              template: 'treemap',
            })
          ] : [],
          // Optimize dependency pre-bundling
          optimizeDeps: {
            // Exclude large deps from pre-bundling in low memory mode
            exclude: isLowMemory ? [
              '@fullcalendar/core',
              '@fullcalendar/daygrid',
              '@fullcalendar/timegrid',
              '@fullcalendar/interaction',
              'apexcharts',
              'xlsx',
              'xlsx-js-style',
            ] : [],
            // Include common deps to speed up initial load
            include: [
              'vue',
              'vue-router',
              'pinia',
              'axios',
              'quasar',
            ],
          },
          server: {
            // Additional optimizations for dev server
            fs: {
              // Restrict file serving to project root
              strict: true,
            },
            watch: {
              // Ignore large/unneeded directories
              ignored: [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
                '**/.quasar/**',
                '**/coverage/**',
                '**/cypress/**',
                '**/test-results/**',
                '**/*.log',
              ],
            },
          },
        };
      },
      // viteVuePluginOptions: {},

      vitePlugins: [
        // Only enable type/lint checking in standard mode
        // RE-ENABLED AFTER TYPESCRIPT FIXES
        false && [
          'vite-plugin-checker',
          {
            vueTsc: false,
            eslint: isLowMemory ? false : {
              lintCommand: 'eslint "./**/*.{js,ts,mjs,cjs,vue}"',
            },
          },
          { server: false },
        ],
      ].filter(Boolean),
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      https: process.env.HTTPS === 'true' ? (() => {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        const certPath = path.join(os.homedir(), '.certs');
        const keyPath = path.join(certPath, 'localhost-key.pem');
        const certFilePath = path.join(certPath, 'localhost.pem');
        
        if (fs.existsSync(keyPath) && fs.existsSync(certFilePath)) {
          return {
            key: fs.readFileSync(keyPath).toString(),
            cert: fs.readFileSync(certFilePath).toString()
          };
        }
        console.warn('HTTPS certificates not found. Run ./setup-https.sh first');
        return false;
      })() : false,
      open: false, // opens browser window automatically
      watch: {
        // Reduce memory usage by not following symlinks
        followSymlinks: false,
        // Use polling in minimal mode (less memory intensive)
        usePolling: isMinimalMemory,
        interval: isMinimalMemory ? 1000 : 100,
      },
      // Limit concurrent requests in low memory mode
      ...(isLowMemory ? {
        hmr: {
          timeout: 60000, // Increase timeout for slower processing
        },
      } : {}),
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
    framework: {
      config: {
        loadingBar: {
          color: 'primary',
          size: '3px',
          position: 'top'
        }
      },

      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: ['Dialog', 'Notify', 'LocalStorage', 'SessionStorage', 'Loading', 'LoadingBar'],
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   registerServiceWorker: 'src-pwa/register-service-worker',
    //   serviceWorker: 'src-pwa/custom-service-worker',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload'
    // },

    // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      // ssrPwaHtmlFilename: 'offline.html', // do NOT use index.html as name!
      // will mess up SSR

      // extendSSRWebserverConf (esbuildConf) {},
      // extendPackageJson (json) {},

      pwa: false,

      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,

      prodPort: 3000, // The default port that the production server should use
      // (gets superseded if process.env.PORT is specified at runtime)

      middlewares: [
        'render', // keep this as last one
      ],
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'generateSW', // or 'injectManifest'
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
      // useFilenameHashes: true,
      // extendGenerateSWOptions (cfg) {}
      // extendInjectManifestOptions (cfg) {},
      // extendManifestJson (json) {}
      // extendPWACustomSWConf (esbuildConf) {}
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (esbuildConf)
      // extendElectronPreloadConf (esbuildConf)

      inspectPort: 5858,

      bundler: 'packager', // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',
        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        // https://www.electron.build/configuration/configuration

        appId: 'ante-frontend',
      },
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      contentScripts: ['my-content-script'],

      // extendBexScriptsConf (esbuildConf) {}
      // extendBexManifestJson (json) {}
    },
  };
});
