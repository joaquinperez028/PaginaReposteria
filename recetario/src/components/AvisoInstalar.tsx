import { useEffect, useState } from 'react'
import { esAndroid, esNavegadorXiaomi, estaInstalada } from '../lib/plataforma'

interface EventoInstalar extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const CLAVE = 'aviso-instalar-cerrado'

function leerCerrado() {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

/**
 * En HyperOS: si se abrió en Mi Browser, sugiere Chrome (instalación y cámara confiables).
 * En Chrome: ofrece "Instalar app" cuando el navegador lo permite.
 */
export function AvisoInstalar() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null)
  const [cerrado, setCerrado] = useState(leerCerrado)

  useEffect(() => {
    const capturar = (e: Event) => {
      e.preventDefault()
      setEvento(e as EventoInstalar)
    }
    const instalada = () => setEvento(null)
    window.addEventListener('beforeinstallprompt', capturar)
    window.addEventListener('appinstalled', instalada)
    return () => {
      window.removeEventListener('beforeinstallprompt', capturar)
      window.removeEventListener('appinstalled', instalada)
    }
  }, [])

  const cerrar = () => {
    setCerrado(true)
    try {
      localStorage.setItem(CLAVE, '1')
    } catch {
      // sin almacenamiento: se vuelve a mostrar la próxima vez
    }
  }

  if (estaInstalada()) return null

  if (esAndroid && esNavegadorXiaomi) {
    return (
      <div className="mx-4 mt-1 flex items-start gap-3 rounded-2xl bg-aviso-fondo p-3.5 text-[14px] leading-snug text-aviso">
        <span className="flex-1">
          <strong>Abrila en Chrome.</strong> El navegador de Xiaomi no deja instalar la app y puede fallar con la cámara.
          Copiá la dirección y pegala en Chrome.
        </span>
      </div>
    )
  }

  if (!evento || cerrado) return null

  return (
    <div className="mx-4 mt-1 flex items-center gap-3 rounded-2xl border border-borde bg-tarjeta p-3">
      <img src="/icono-192.png" alt="" className="size-11 rounded-xl" />
      <span className="flex-1 text-[14px] leading-snug">
        <strong>Instalala en el teléfono</strong>
        <br />
        <span className="text-tinta-suave">Ícono en el inicio y funciona sin conexión.</span>
      </span>
      <button
        onClick={async () => {
          await evento.prompt()
          await evento.userChoice
          setEvento(null)
        }}
        className="h-11 rounded-xl bg-frutilla px-3.5 text-sm font-semibold text-tarjeta"
      >
        Instalar
      </button>
      <button aria-label="Ahora no" onClick={cerrar} className="flex size-9 items-center justify-center rounded-lg text-tinta-suave">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  )
}
