import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  // host: true → escuta em IPv4 e IPv6 (sem isso o Chrome pode não achar o localhost);
  // strictPort → erro claro se a porta estiver ocupada, em vez de pular para 5174
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 4173, strictPort: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Holambra 14–15/11',
        short_name: 'Holambra',
        lang: 'pt-BR',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#F4F5F7',
        theme_color: '#E8613C',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Pré-cache de tudo do build, inclusive os tiles (public/tiles) e as fotos (public/fotos)
        globPatterns: ['**/*.{js,css,html,png,webp,svg,ico,woff,woff2,webmanifest}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
});
