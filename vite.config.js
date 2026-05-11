import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,topojson}'],
        // topojson ファイルが大きいので上限を引き上げ
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: 'たびいろ',
        short_name: 'たびいろ',
        description: '旅の記憶を地図に刻む',
        theme_color: '#EDE9E3',
        background_color: '#F0EDE8',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ja',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png',          sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png',         sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',         sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
