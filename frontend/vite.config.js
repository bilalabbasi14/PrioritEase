import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // injectManifest = use our own sw.js (in /public) instead of auto-generating one.
      // This is required because we need a custom push handler in the SW.
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',

      registerType: 'autoUpdate',

      // Assets Vite will precache via the injected manifest
      includeAssets: [
        'prioritease.svg',
        'icons.svg',
        'icons/icon-192x192.png',
        'icons/icon-512x512.png',
        'icons/badge-72x72.png',
      ],

      devOptions: {
        enabled: true,
        type: 'module',
      },

      manifest: {
        name: 'PrioritEase',
        short_name: 'PrioritEase',
        description: 'Prioritize tasks, track deadlines, and manage assignments on a unified dashboard.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f0a1e',
        theme_color: '#0f0a1e',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/prioritease.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
})