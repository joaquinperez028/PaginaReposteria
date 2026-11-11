// Plataforma objetivo (DECISIONES.md P23): Redmi con HyperOS, usando Chrome.

const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent

export const esAndroid = /Android/i.test(ua)
/** Navegador de Xiaomi (Mi Browser, MIUI/HyperOS): no permite instalar la app y su soporte de cámara web es limitado. */
export const esNavegadorXiaomi = /MiuiBrowser/i.test(ua)

export function estaInstalada(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
}

/**
 * Pide que el navegador no borre los datos guardados en el teléfono (clave para el modo sin conexión).
 * Chrome lo concede automáticamente a las apps instaladas.
 */
export async function pedirAlmacenamientoPersistente() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist()
  } catch {
    // no disponible: no pasa nada
  }
}
