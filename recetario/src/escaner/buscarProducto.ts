import type { ResultadoProducto } from '../servidor/buscarProducto'

export type { ResultadoProducto }

/**
 * Busca un código en todas las fuentes a través de /api/producto.
 * Si la función del servidor no existe (ej. hosting estático), consulta Open Food Facts directo.
 * Lanza error si no hay conexión: el producto queda "pendiente de identificar".
 */
export async function buscarProductoEnFuentes(codigo: string): Promise<ResultadoProducto[]> {
  if (!navigator.onLine) throw new Error('Sin conexión')
  const res = await fetch(`/api/producto?codigo=${encodeURIComponent(codigo)}`)
  if (res.ok) {
    const datos = (await res.json()) as { resultados?: ResultadoProducto[] }
    return datos.resultados ?? []
  }
  return buscarSoloOpenFoodFacts(codigo)
}

async function buscarSoloOpenFoodFacts(codigo: string): Promise<ResultadoProducto[]> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json?fields=product_name,product_name_es,brands,quantity`,
  )
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`Open Food Facts respondió ${res.status}`)
  const datos = (await res.json()) as { product?: { product_name?: string; product_name_es?: string; brands?: string; quantity?: string } }
  const nombre = datos.product?.product_name_es || datos.product?.product_name
  if (!nombre) return []
  const { parsearPresentacion } = await import('../lib/presentacion')
  return [
    {
      fuente: 'openfoodfacts',
      fuenteNombre: 'Open Food Facts',
      pais: 'Mundial',
      nombre,
      marca: datos.product?.brands?.split(',')[0]?.trim() || undefined,
      presentacion: parsearPresentacion(datos.product?.quantity),
    },
  ]
}
