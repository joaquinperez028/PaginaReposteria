import type { Presentacion, Unidad } from './costeo'

const ALIAS: Record<string, Unidad> = {
  g: 'g', gr: 'g', grs: 'g', gramo: 'g', gramos: 'g',
  kg: 'kg', kgs: 'kg', kilo: 'kg', kilos: 'kg',
  ml: 'ml', cc: 'ml', cm3: 'ml',
  l: 'l', lt: 'l', lts: 'l', litro: 'l', litros: 'l',
  u: 'u', un: 'u', und: 'u', unid: 'u', unidad: 'u', unidades: 'u',
}

/**
 * Lee la presentación desde un texto: "900 ml", "1kg", "Aceite Óptimo 1,5 L", "6 x 500 g" (→ 3000 g).
 * Devuelve undefined si no encuentra una cantidad con unidad.
 */
export function parsearPresentacion(texto: string | undefined): Presentacion | undefined {
  if (!texto) return undefined
  const t = texto.toLowerCase().replace(/\s+/g, ' ')
  const multi = t.match(/(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*([a-z0-9]+)\b/)
  if (multi) {
    const unidad = ALIAS[multi[3]]
    if (unidad) return { cantidad: Number(multi[1]) * Number(multi[2].replace(',', '.')), unidad }
  }
  for (const m of t.matchAll(/(\d+(?:[.,]\d+)?)\s*([a-z0-9]+)\b/g)) {
    const unidad = ALIAS[m[2]]
    const cantidad = Number(m[1].replace(',', '.'))
    if (unidad && cantidad > 0) return { cantidad, unidad }
  }
  return undefined
}

const NOMBRE: Record<Unidad, [string, string]> = {
  g: ['g', 'g'],
  kg: ['kg', 'kg'],
  ml: ['ml', 'ml'],
  l: ['l', 'l'],
  u: ['unidad', 'unidades'],
}

/** { 900, 'ml' } → "900 ml"; { 30, 'u' } → "30 unidades" */
export function textoPresentacion(p: Presentacion): string {
  const n = p.cantidad.toLocaleString('es-UY', { maximumFractionDigits: 2 })
  return `${n} ${NOMBRE[p.unidad][p.cantidad === 1 ? 0 : 1]}`
}
