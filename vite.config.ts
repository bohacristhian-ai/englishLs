import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'englishLs — Englisch B2',
        short_name: 'englishLs',
        description: 'Lernkarteikarten für Englisch B2 mit Fokus auf Aussprache und Leitner-System.',
        lang: 'de',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fdfdfc',
        theme_color: '#2f5d50',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            // Launchers crop icons to their own shape; the maskable variant
            // keeps the glyph inside the safe zone so it never gets clipped.
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // All 500 words are bundled into the JS, so precaching the build makes
        // the whole vocabulary available offline — no runtime fetching needed.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Domain logic must stay runnable without a DOM; jsdom is only for components.
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
