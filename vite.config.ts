/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'bujo — bullet journal',
        short_name: 'bujo',
        description: 'A minimal, private, local-first digital bullet journal.',
        theme_color: '#1e1e2e',
        background_color: '#1e1e2e',
        display: 'standalone',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Cache the app shell + Google Fonts for offline use.
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Keep recharts + its d3/victory deps in ONE chunk — splitting them
        // across lazy chunks causes a prod-only cross-chunk init crash
        // ("r is not a function" from RadarChart).
        manualChunks(id) {
          if (/node_modules\/(recharts|react-smooth|victory-vendor|d3-|internmap|recharts-scale)/.test(id)) {
            return 'recharts'
          }
          // Icon path data: 152 glyphs at two weights, generated from Phosphor
          // by scripts/build-icons.mjs. It changes only when the vocabulary
          // changes, so it gets its own long-lived chunk rather than
          // invalidating the app bundle on every release.
          if (/src[\\/]components[\\/]icon-paths/.test(id)) {
            return 'icons'
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    // `.claude/worktrees/*` are git worktrees other sessions check out inside
    // the repo. Each holds a full second copy of the app, so vitest was
    // discovering both suites and reporting their sum: 743 tests here read as
    // 1474 while a worktree existed, and the number moved whenever an unrelated
    // session added or removed one. A count that changes with what else is
    // checked out is worse than no count — it was quoted in commit messages
    // before anyone noticed. eslint already ignores this path for the same
    // reason (see eslint.config.js).
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/worktrees/**'],
  },
})
