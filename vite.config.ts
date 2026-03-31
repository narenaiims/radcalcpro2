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
      ],
      define: {},
      resolve: {
        alias: {
          '@': path.resolve(process.cwd(), '.'),
        }
      },
      optimizeDeps: {
        include: [
          'react', 'react-dom', 'react-router-dom',
          'lucide-react',
          'recharts', 'mathjs', 'date-fns',
          'idb', 'workbox-window'
        ],
        exclude: ['motion']
      },
      build: {
        target: 'es2020',
        outDir: 'dist',
        emptyOutDir: true,
        assetsInlineLimit: 0,
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'chart-vendor': ['recharts'],
              'motion-vendor': ['motion'],
              'pdf-vendor': ['@react-pdf/renderer'],
            }
          },
          onwarn(warning, warn) {
            // Suppress TypeScript extension warnings from importmap-style imports
            if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
            warn(warning);
          }
        }
      }
    };
});