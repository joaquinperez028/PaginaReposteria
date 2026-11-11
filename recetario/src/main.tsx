import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'

// Fuentes empaquetadas con la app (funcionan sin conexión, sin depender de Google Fonts).
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource/figtree/400.css'
import '@fontsource/figtree/500.css'
import '@fontsource/figtree/600.css'
import '@fontsource/figtree/700.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import '@fontsource/caveat/700.css'

import './index.css'
import { App } from './App'
import { pedirAlmacenamientoPersistente } from './lib/plataforma'

registerSW({ immediate: true })
void pedirAlmacenamientoPersistente()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
