/**
 * VITE CONFIG — for local development and production build only.
 * When running in Google AI Studio, this file is ignored.
 * AI Studio uses the importmap in index.html instead.
 * To build for production: npm run build
 * To run in AI Studio: upload project files directly, vite.config.ts is unused.
 */
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', 'VITE_');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        VitePWA({
          registerType: 'prompt',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
            name: 'RadCalcPro — Radiation Oncology Toolkit',
            short_name: 'RadCalcPro',
            description: 'Clinical radiobiology calculators, OAR constraints, SBRT reference and viva preparation for radiation oncology postgraduates.',
            theme_color: '#1e3a5f',
            background_color: '#1e3a5f',
            display: 'standalone',
            orientation: 'portrait-primary',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-stylesheets',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-webfonts',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  }
                }
              },
              {
                // Cache-first for calculator pages (static assets)
                urlPattern: /\/assets\/.*\.js/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'calculator-scripts',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30
                  }
                }
              },
              {
                // Network-first for clinical guidelines (assuming they might be fetched from an API or specific path)
                urlPattern: /\/api\/guidelines\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'clinical-guidelines',
                  networkTimeoutSeconds: 5,
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 7
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY ?? '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        include: [
          'react', 'react-dom', 'react-router-dom',
          'lucide-react', 'react-to-print',
          'recharts', 'mathjs', 'date-fns',
          'html2canvas', 'jspdf', 'idb', 'workbox-window'
        ],
        exclude: ['motion']
      },
      build: {
        target: 'es2020',
        assetsInlineLimit: 0,
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'chart-vendor': ['recharts'],
              'motion-vendor': ['motion'],
              'pdf-vendor': ['html2canvas', 'jspdf'],
            }
          },
          onwarn(warning, warn) {
            // Suppress TypeScript extension warnings from importmap-style imports
            if (warning.code === 'UNRESOLVED_IMPORT') return;
            if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
            warn(warning);
          }
        }
      }
    };
});