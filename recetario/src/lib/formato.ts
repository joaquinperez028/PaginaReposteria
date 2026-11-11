const LOCALE = 'es-UY'

/** $17,79 · $60 · $1.250. Sin decimales cuando el número es entero, salvo que se pidan. */
export function pesos(n: number, decimales?: number): string {
  const d = decimales ?? (Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2)
  return '$' + n.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d })
}

/** Siempre con dos decimales: para costos. */
export const costo = (n: number) => pesos(n, 2)

/** 0,296 → "29,6%" */
export function porcentaje(x: number, decimales = 1): string {
  if (!Number.isFinite(x)) return '—'
  return (x * 100).toLocaleString(LOCALE, { maximumFractionDigits: decimales }) + '%'
}

export function numero(n: number, decimales = 2): string {
  return n.toLocaleString(LOCALE, { maximumFractionDigits: decimales })
}

/** 75 → "1 h 15 min" */
export function duracion(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function haceDias(dias: number): string {
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  if (dias < 14) return 'hace 1 semana'
  if (dias < 30) return `hace ${Math.floor(dias / 7)} semanas`
  return `hace ${dias} días`
}
