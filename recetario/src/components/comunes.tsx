import { useEffect, useState, type ReactNode } from 'react'
import type { Estado } from '../lib/tipos'

export const NOMBRE_ESTADO: Record<Estado, string> = {
  idea: 'Idea',
  probada: 'Probada',
  lista: 'Lista para vender',
}

export function InsigniaEstado({ estado }: { estado: Estado }) {
  const estilos: Record<Estado, string> = {
    idea: 'bg-linea text-tinta-media',
    probada: 'bg-pistacho-claro text-pistacho',
    lista: 'bg-frutilla text-tarjeta',
  }
  return (
    <span className={`self-start rounded-md px-2 py-0.5 text-xs font-semibold ${estilos[estado]}`}>
      {NOMBRE_ESTADO[estado]}
    </span>
  )
}

/** Recuadro de foto; mientras no hay foto muestra la inicial sobre el color del producto. */
export function Miniatura({ nombre, tono, foto, className = '' }: { nombre: string; tono: string; foto?: string; className?: string }) {
  if (foto) return <img src={foto} alt="" className={`object-cover ${className}`} />
  return (
    <div
      className={`flex items-center justify-center font-display font-bold ${className}`}
      style={{ background: tono, color: '#2B1712B3' }}
      aria-hidden="true"
    >
      {nombre.charAt(0)}
    </div>
  )
}

export function Nota({ children }: { children: ReactNode }) {
  return <span className="font-mano text-[19px] font-bold leading-none text-frutilla">{children}</span>
}

export function Seccion({ titulo, extra, children }: { titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="mx-4 mt-6 flex flex-col">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="m-0 font-display text-[22px] font-semibold">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  )
}

export function Lista({ children }: { children: ReactNode }) {
  return (
    <div className="numeros overflow-hidden rounded-[18px] border border-borde bg-tarjeta [&>*+*]:border-t [&>*+*]:border-linea">
      {children}
    </div>
  )
}

export function useEnLinea() {
  const [enLinea, setEnLinea] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const on = () => setEnLinea(true)
    const off = () => setEnLinea(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return enLinea
}

/** Hoja inferior modal, usada para "Calcular de otra manera" y "Buscar en el catálogo". */
export function HojaInferior({ titulo, alCerrar, children }: { titulo: string; alCerrar: () => void; children: ReactNode }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && alCerrar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [alCerrar])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-noche/50" onClick={alCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="flex max-h-[88dvh] w-full max-w-[480px] flex-col gap-4 overflow-y-auto rounded-t-[26px] bg-fondo px-[18px] pb-7 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-[5px] w-10 self-center rounded-full bg-borde-fuerte" />
        <div className="flex items-center justify-between">
          <h2 className="m-0 font-display text-[22px] font-semibold">{titulo}</h2>
          <button
            aria-label="Cerrar"
            onClick={alCerrar}
            className="flex size-11 items-center justify-center rounded-[14px] border border-borde bg-tarjeta"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
