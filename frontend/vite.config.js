import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Arahkan ke service worker kustom kita
      srcDir: 'src',
      filename: 'sw.js',
      strategies: 'injectManifest',
      injectManifest: {
        // Di mode development, jangan precache apa pun agar instalasi cepat.
        globPatterns: process.env.NODE_ENV === 'development' ? [] : ['**/*.{js,css,html,ico,png,svg}'],
      },
      devOptions: {
        enabled: true, // Aktifkan SW di mode development
        type: 'module',
      },
      manifest: {
        name: 'Pentol Kobong Kasir',
        short_name: 'Pentol Kobong',
        start_url: '/',
        display: 'standalone',
        description: 'Aplikasi Kasir untuk Pentol Kobong',
        theme_color: '#ff4500',
        icons: [
          {
            src: 'logo-192.png', // Anda perlu membuat ikon ini di folder public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-512.png', // Anda perlu membuat ikon ini di folder public
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        screenshots: [
          {
        "src": "/screenshots/screenshot-desktop.png",
        "sizes": "1280x720",
        "type": "image/png",
        "form_factor": "wide",
        "label": "Tampilan Laporan di Desktop"
      },
      {
        "src": "/screenshots/screenshot-mobile.png",
        "sizes": "720x1280",
        "type": "image/png",
        "form_factor": "narrow",
        "label": "Tampilan Laporan di Mobile"
      }
        ]
      }
    })
  ],
})