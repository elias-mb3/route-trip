import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// --mode android: sem service worker (no APK os arquivos já são locais e o SW só
// causaria cache velho entre versões do app)
const versao = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;

export default defineConfig(({ mode }) => ({
  base: './',
  define: { __VERSAO__: JSON.stringify(versao) },
  resolve: mode === 'android'
    ? { alias: { 'virtual:pwa-register/react': fileURLToPath(new URL('./src/lib/pwa-stub.ts', import.meta.url)) } }
    : undefined,
  // host: true → escuta em IPv4 e IPv6 (sem isso o Chrome pode não achar o localhost);
  // strictPort → erro claro se a porta estiver ocupada, em vez de pular para 5174
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 4173, strictPort: true },
  plugins: [
    react(),
    mode !== 'android' && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Viagem',
        short_name: 'Viagem',
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
}));
