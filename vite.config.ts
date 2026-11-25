import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    // App instalável (PWA): manifesto, ícones e service worker
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/app',
        name: 'AMBISAFE — Inventário Florestal',
        short_name: 'AMBISAFE',
        description: 'Inventário florestal inteligente com IA, fitossociologia automática e relatórios técnicos.',
        lang: 'pt-BR',
        start_url: '/app/dashboard',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#00420d',
        theme_color: '#00420d',
        categories: ['productivity', 'business'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Novo projeto', url: '/app/projetos/novo', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Meus projetos', url: '/app/projetos', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Dados do Supabase nunca ficam em cache (sempre online e atualizados)
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith('supabase.co'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    target: 'chrome90',
    rollupOptions: {
      output: {
        // Separa bibliotecas pesadas para o app abrir mais rápido no celular
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          supabase: ['@supabase/supabase-js'],
          motion: ['motion'],
        },
      },
    },
  },
})
