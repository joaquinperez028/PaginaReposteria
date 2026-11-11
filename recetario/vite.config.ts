/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { buscarProductoConDiagnostico } from './src/servidor/buscarProducto'

/** En `npm run dev`, atiende /api/producto igual que la función de Vercel. */
function apiLocal(): Plugin {
  return {
    name: 'api-local',
    configureServer(server) {
      server.middlewares.use('/api/producto', async (req, res) => {
        const params = new URL(req.url ?? '/', 'http://local').searchParams
        const { resultados, fuentes } = await buscarProductoConDiagnostico(params.get('codigo') ?? '')
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify(params.has('diagnostico') ? { resultados, fuentes } : { resultados }, null, 2))
      })
    },
  }
}

// `npm run dev:https` sirve la app con HTTPS en la red local: así Chrome en el Redmi habilita la cámara.
export default defineConfig(({ mode }) => ({
  plugins: [
    ...(mode === 'https' ? [basicSsl()] : []),
    apiLocal(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icono.svg'],
      manifest: {
        name: 'Recetario — costeo de recetas',
        short_name: 'Recetario',
        lang: 'es-UY',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F6EEE3',
        theme_color: '#9B2342',
        // PNG 192/512 + maskable: lo que exige Chrome en Android (HyperOS) para ofrecer "Instalar app".
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icono.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Toda la app queda guardada en el teléfono para funcionar sin conexión.
        globPatterns: ['**/*.{js,css,html,svg,png,wasm,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Respaldo del lector (ZXing en WASM) para navegadores sin lector nativo: se descarga la primera vez y queda guardado.
        runtimeCaching: [
          {
            urlPattern: /jsdelivr\.net\/npm\/zxing-wasm/,
            handler: 'CacheFirst',
            options: { cacheName: 'lector-codigos', expiration: { maxEntries: 4 } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
}))
