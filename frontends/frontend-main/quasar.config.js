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
    // OPTIMIZED: Heavy components (apexchart, fullcalendar) moved to lazy-components (TASK-002)
    // Monitoring: Only Sentry (production-only, internal check)
    boot: [
      'sentry',          // Production-only (internal check)
      'axios',           // Essential - HTTP client
      'supabase',        // Essential - Database client
      'auth',            // Essential - Authentication
      'multi-account',   // Essential - Account switching
      'mixins',          // Essential - Global mixins
      'bus',             // Essential - Event bus
      'lazy-components', // Lazy-loaded heavy components (ApexChart, FullCalendar)
      'theme',           // Essential - Theming
      'route-loading',   // Essential - Route loading states
      'google-auth'      // OAuth - consider lazy loading later
    ],

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
        
        // Only load the .env file (which is created from env.staging or env.production)
        const result = dotenv.config({ path: path.resolve(__dirname, '.env') });
        
        return result.parsed || {};
      })(),
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
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
      // rawDefine: {}
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir

      extendViteConf(viteConf) {
        // Set resolve aliases
        viteConf.resolve = viteConf.resolve || {};
        viteConf.resolve.alias = {
          ...(viteConf.resolve.alias || {}),
          '@': path.resolve(__dirname, './src'),
          '@components': path.resolve(__dirname, './src/components'),
          '@layouts': path.resolve(__dirname, './src/layouts'),
          '@pages': path.resolve(__dirname, './src/pages'),
          '@stores': path.resolve(__dirname, './src/stores'),
          '@utils': path.resolve(__dirname, './src/utility'),
          '@interfaces': path.resolve(__dirname, './src/interfaces'),
          '@shared': path.resolve(__dirname, './src/shared'),
        };

        // Set build options
        viteConf.build = viteConf.build || {};
        viteConf.build.chunkSizeWarningLimit = 750;
        viteConf.build.sourcemap = isLowMemory ? false : true;

        // OPTIMIZED: Aggressive code splitting for all modes (TASK-003)
        viteConf.build.rollupOptions = viteConf.build.rollupOptions || {};
        viteConf.build.rollupOptions.output = viteConf.build.rollupOptions.output || {};

        // Add bundle analyzer plugin if ANALYZE=true
        if (process.env.ANALYZE === 'true') {
          viteConf.plugins = viteConf.plugins || [];
          viteConf.plugins.push(
            visualizer({
              filename: './dist/spa/stats.html',
              open: false,
              gzipSize: true,
              brotliSize: true,
              template: 'treemap',
            })
          );
        }

        // Set manualChunks function
        viteConf.build.rollupOptions.output.manualChunks = function(id) {
                  // Vendor library chunking
                  if (id.includes('node_modules')) {
                    // CRITICAL: Do NOT split Vue or Quasar - must stay in main bundle
                    // Splitting causes async loading → 'pt is not a function' errors
                    // By not returning a chunk name, they'll be included in index.js

                    // Skip Vue and Quasar - let them bundle with main entry point
                    if (id.includes('vue/') || id.includes('vue\\') || id.includes('quasar')) {
                      return undefined; // Stay in main bundle
                    }

                    // Secondary dependencies - safe to split
                    if (id.includes('pinia')) {
                      return 'vendor-vue-state';
                    }
                    if (id.includes('vue-router')) {
                      return 'vendor-vue-router';
                    }

                    // Charts - IMPORTANT: Separate Vue wrappers from core libs
                    if (id.includes('vue3-apexcharts')) {
                      return 'vendor-charts-vue'; // Vue wrapper - loads after vue-core
                    }
                    if (id.includes('apexcharts')) {
                      return 'vendor-charts-core'; // Pure JS lib - no Vue dependency
                    }
                    if (id.includes('@fullcalendar/vue3')) {
                      return 'vendor-calendar-vue'; // Vue wrapper
                    }
                    if (id.includes('@fullcalendar')) {
                      return 'vendor-calendar-core'; // Core library
                    }

                    // Heavy libraries (lazy loaded on-demand)
                    if (id.includes('xlsx')) {
                      return 'vendor-excel';
                    }
                    if (id.includes('jspdf') || id.includes('html2canvas')) {
                      return 'vendor-pdf';
                    }

                    // Communication & Monitoring
                    if (id.includes('socket.io')) {
                      return 'vendor-socket';
                    }
                    if (id.includes('@sentry')) {
                      return 'vendor-sentry';
                    }

                    // Database & API
                    if (id.includes('@supabase')) {
                      return 'vendor-supabase';
                    }
                    if (id.includes('axios')) {
                      return 'vendor-axios';
                    }

                    // UI Libraries
                    if (id.includes('draggable') || id.includes('zoomable')) {
                      return 'vendor-ui-advanced';
                    }
                    if (id.includes('qrcode')) {
                      return 'vendor-qrcode';
                    }

                    // Everything else
                    return 'vendor-other';
                  }

                  // Module-based chunking for pages
                  if (id.includes('/pages/Member/')) {
                    // School Management (largest - 1MB+)
                    if (id.includes('/pages/Member/SchoolManagement/')) {
                      if (id.includes('StudentManagement')) {
                        return 'module-school-students'; // 1MB chunk
                      }
                      return 'module-school';
                    }

                    // CMS Module
                    if (id.includes('/pages/Member/CMS/')) {
                      if (id.includes('ContentTypeBuilder')) {
                        return 'module-cms-builder'; // 176KB chunk
                      }
                      if (id.includes('/API/')) {
                        return 'module-cms-api';
                      }
                      return 'module-cms';
                    }

                    // HRIS/Manpower Module
                    if (id.includes('/pages/Member/Manpower/')) {
                      if (id.includes('/payroll/')) {
                        return 'module-hris-payroll'; // Large payroll dialogs
                      }
                      if (id.includes('/dialogs/')) {
                        return 'module-hris-dialogs';
                      }
                      return 'module-hris';
                    }

                    // Treasury Module
                    if (id.includes('/pages/Member/Treasury/')) {
                      if (id.includes('/dialogs/')) {
                        return 'module-treasury-dialogs';
                      }
                      return 'module-treasury';
                    }

                    // Developer Tools
                    if (id.includes('/pages/Member/Developer/')) {
                      if (id.includes('DatabaseViewer')) {
                        return 'module-developer-db'; // Heavy database viewer
                      }
                      return 'module-developer';
                    }

                    // Settings
                    if (id.includes('/pages/Member/Settings/')) {
                      if (id.includes('/dialogs/')) {
                        return 'module-settings-dialogs';
                      }
                      return 'module-settings';
                    }

                    // Asset Management
                    if (id.includes('/pages/Member/Asset/')) {
                      return 'module-asset';
                    }

                    // Project Management
                    if (id.includes('/pages/Member/Project/')) {
                      return 'module-project';
                    }

                    // Leads/CRM
                    if (id.includes('/pages/Member/Leads/')) {
                      return 'module-leads';
                    }
                  }

                  // Component-based chunking
                  if (id.includes('/components/')) {
                    // Heavy shared components
                    if (id.includes('MediaLibraryCore')) {
                      return 'component-media-library';
                    }
                    if (id.includes('/dialog/') || id.includes('Dialog.vue')) {
                      return 'component-dialogs';
                    }
                    if (id.includes('/workflow/')) {
                      return 'component-workflow';
                    }
                  }
        };

        // Optimize dependency pre-bundling
        viteConf.optimizeDeps = viteConf.optimizeDeps || {};
        viteConf.optimizeDeps.exclude = isLowMemory ? [
          '@fullcalendar/core',
          '@fullcalendar/daygrid',
          '@fullcalendar/timegrid',
          '@fullcalendar/interaction',
          'apexcharts',
          'xlsx',
          'xlsx-js-style',
        ] : [];
        viteConf.optimizeDeps.include = [
          'vue',
          'vue-router',
          'pinia',
          'axios',
          'quasar',
        ];

        // Server configuration
        viteConf.server = viteConf.server || {};
        viteConf.server.fs = viteConf.server.fs || {};
        viteConf.server.fs.strict = true;
        viteConf.server.watch = viteConf.server.watch || {};
        viteConf.server.watch.ignored = [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/.quasar/**',
          '**/coverage/**',
          '**/cypress/**',
          '**/test-results/**',
          '**/*.log',
        ];
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
