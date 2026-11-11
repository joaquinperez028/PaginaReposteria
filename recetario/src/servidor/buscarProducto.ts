// Búsqueda de un código de barras en muchas fuentes gratuitas, en paralelo. Corre en el servidor
// (función de Vercel /api/producto y, en desarrollo, dentro de Vite) porque las tiendas y varias bases
// no permiten consultas directas desde el navegador.
//
// Fuentes (todas sin costo):
//   • Familia Open Food Facts: alimentos (+4 millones), y sus bases hermanas de productos en general,
//     cosmética y mascotas. Fuerte en Argentina y Brasil.
//   • Supermercados con catálogo público VTEX (El Dorado en Uruguay; Carrefour, Jumbo, Disco, Vea y Día en Argentina):
//     nombre como se vende, presentación y precio de góndola.
//   • Cosmos (Bluesoft): la base más grande de Brasil. Necesita un token gratis (variable COSMOS_TOKEN).
//   • UPCitemdb: base internacional (prueba gratis, 100 consultas por día).
//
// `?diagnostico=1` devuelve el estado de cada fuente, para saber cuáles responden.
import type { Presentacion } from '../lib/costeo'
import { parsearPresentacion } from '../lib/presentacion'

export interface ResultadoProducto {
  fuente: string
  fuenteNombre: string
  /** País de la fuente, para mostrar de dónde salió el dato. */
  pais?: 'UY' | 'AR' | 'BR' | 'Mundial'
  nombre: string
  marca?: string
  presentacion?: Presentacion
  /** Precio en la tienda online (solo supermercados), por la presentación. */
  precio?: number
  moneda?: 'UYU' | 'ARS' | 'BRL'
  imagen?: string
}

export interface EstadoFuente {
  fuente: string
  estado: 'encontrado' | 'no-esta' | 'error' | 'sin-configurar'
  detalle?: string
  ms: number
}

const TIEMPO_MAXIMO_MS = 7000
const AGENTE = 'Recetario/0.1 (app personal de costeo de recetas)'

type Respuesta<T> = { ok: true; datos: T } | { ok: false; detalle: string; noEsta?: boolean }

async function obtenerJson<T>(url: string, headers: Record<string, string> = {}): Promise<Respuesta<T>> {
  const control = new AbortController()
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS)
  try {
    const res = await fetch(url, { signal: control.signal, headers: { 'User-Agent': AGENTE, Accept: 'application/json', ...headers } })
    if (res.status === 404) return { ok: false, detalle: 'HTTP 404', noEsta: true }
    if (!res.ok) return { ok: false, detalle: `HTTP ${res.status}` }
    return { ok: true, datos: (await res.json()) as T }
  } catch (e) {
    return { ok: false, detalle: (e as Error).name === 'AbortError' ? 'sin respuesta (tiempo agotado)' : String(e) }
  } finally {
    clearTimeout(temporizador)
  }
}

type Busqueda = (codigo: string) => Promise<ResultadoProducto | Respuesta<never> | null>

interface Fuente {
  id: string
  buscar: Busqueda
  /** Si devuelve false, la fuente se saltea (ej. falta el token). */
  configurada?: () => boolean
}

// ── Familia Open Food Facts ────────────────────────────────────────────────────────────────
const OPEN_FACTS = [
  { id: 'openfoodfacts', nombre: 'Open Food Facts', host: 'world.openfoodfacts.org' },
  { id: 'openproductsfacts', nombre: 'Open Products Facts', host: 'world.openproductsfacts.org' },
  { id: 'openbeautyfacts', nombre: 'Open Beauty Facts', host: 'world.openbeautyfacts.org' },
  { id: 'openpetfoodfacts', nombre: 'Open Pet Food Facts', host: 'world.openpetfoodfacts.org' },
]

function fuenteOpenFacts(f: (typeof OPEN_FACTS)[number]): Fuente {
  return {
    id: f.id,
    buscar: async (codigo) => {
      const r = await obtenerJson<{
        status?: number
        product?: { product_name?: string; product_name_es?: string; product_name_pt?: string; brands?: string; quantity?: string; image_front_small_url?: string }
      }>(`https://${f.host}/api/v2/product/${codigo}.json?fields=product_name,product_name_es,product_name_pt,brands,quantity,image_front_small_url`)
      if (!r.ok) return r
      const p = r.datos.product
      const nombre = p?.product_name_es || p?.product_name || p?.product_name_pt
      if (r.datos.status === 0 || !nombre) return null
      return {
        fuente: f.id,
        fuenteNombre: f.nombre,
        pais: 'Mundial',
        nombre,
        marca: p?.brands?.split(',')[0]?.trim() || undefined,
        presentacion: parsearPresentacion(p?.quantity) ?? parsearPresentacion(nombre),
        imagen: p?.image_front_small_url,
      }
    },
  }
}

// ── Supermercados VTEX (catálogo público) ──────────────────────────────────────────────────
interface ProductoVtex {
  productName?: string
  brand?: string
  items?: {
    ean?: string
    images?: { imageUrl?: string }[]
    sellers?: { commertialOffer?: { Price?: number } }[]
  }[]
}

const TIENDAS_VTEX: { id: string; nombre: string; dominio: string; pais: 'UY' | 'AR' | 'BR'; moneda: 'UYU' | 'ARS' | 'BRL' }[] = [
  { id: 'eldorado', nombre: 'El Dorado', dominio: 'https://www.eldorado.com.uy', pais: 'UY', moneda: 'UYU' },
  { id: 'carrefour-ar', nombre: 'Carrefour Argentina', dominio: 'https://www.carrefour.com.ar', pais: 'AR', moneda: 'ARS' },
  { id: 'jumbo-ar', nombre: 'Jumbo Argentina', dominio: 'https://www.jumbo.com.ar', pais: 'AR', moneda: 'ARS' },
  { id: 'disco-ar', nombre: 'Disco Argentina', dominio: 'https://www.disco.com.ar', pais: 'AR', moneda: 'ARS' },
  { id: 'vea-ar', nombre: 'Vea Argentina', dominio: 'https://www.vea.com.ar', pais: 'AR', moneda: 'ARS' },
  { id: 'dia-ar', nombre: 'Día Argentina', dominio: 'https://diaonline.supermercadosdia.com.ar', pais: 'AR', moneda: 'ARS' },
]
// Probadas el 03/11/2026 y descartadas: Ta-Ta, Devoto, Disco y Géant (Uruguay) ya no exponen el catálogo
// público; Carrefour Brasil bloquea las consultas (HTTP 403/503).

function fuenteVtex(t: (typeof TIENDAS_VTEX)[number]): Fuente {
  return {
    id: t.id,
    buscar: async (codigo) => {
      const r = await obtenerJson<ProductoVtex[]>(`${t.dominio}/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${codigo}`)
      if (!r.ok) return r
      const producto = Array.isArray(r.datos) ? r.datos[0] : undefined
      if (!producto?.productName) return null
      const item = producto.items?.find((i) => i.ean === codigo) ?? producto.items?.[0]
      const precio = item?.sellers?.[0]?.commertialOffer?.Price
      return {
        fuente: t.id,
        fuenteNombre: t.nombre,
        pais: t.pais,
        nombre: producto.productName,
        marca: producto.brand || undefined,
        presentacion: parsearPresentacion(producto.productName),
        // Solo los precios uruguayos sirven como precio de compra; los de otros países quedan como dato.
        precio: precio && precio > 0 ? precio : undefined,
        moneda: t.moneda,
        imagen: item?.images?.[0]?.imageUrl,
      }
    },
  }
}

// ── Cosmos (Brasil) ────────────────────────────────────────────────────────────────────────
const tokenCosmos = () => (typeof process !== 'undefined' ? process.env.COSMOS_TOKEN : undefined)

const fuenteCosmos: Fuente = {
  id: 'cosmos-br',
  configurada: () => Boolean(tokenCosmos()),
  buscar: async (codigo) => {
    const r = await obtenerJson<{
      description?: string
      brand?: { name?: string }
      net_weight?: number
      thumbnail?: string
    }>(`https://api.cosmos.bluesoft.com.br/gtins/${codigo}.json`, { 'X-Cosmos-Token': tokenCosmos() ?? '' })
    if (!r.ok) return r
    if (!r.datos.description) return null
    return {
      fuente: 'cosmos-br',
      fuenteNombre: 'Cosmos (Brasil)',
      pais: 'BR',
      nombre: r.datos.description,
      marca: r.datos.brand?.name || undefined,
      presentacion: parsearPresentacion(r.datos.description),
      imagen: r.datos.thumbnail,
    }
  },
}

// ── UPCitemdb ──────────────────────────────────────────────────────────────────────────────
const fuenteUpc: Fuente = {
  id: 'upcitemdb',
  buscar: async (codigo) => {
    const r = await obtenerJson<{ items?: { title?: string; brand?: string; size?: string; images?: string[] }[] }>(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${codigo}`,
    )
    if (!r.ok) return r
    const item = r.datos.items?.[0]
    if (!item?.title) return null
    return {
      fuente: 'upcitemdb',
      fuenteNombre: 'UPCitemdb',
      pais: 'Mundial',
      nombre: item.title,
      marca: item.brand || undefined,
      presentacion: parsearPresentacion(item.size) ?? parsearPresentacion(item.title),
      imagen: item.images?.[0],
    }
  },
}

/** Orden de preferencia: Uruguay → bases abiertas → Argentina/Brasil → internacional. */
const FUENTES: Fuente[] = [
  ...TIENDAS_VTEX.filter((t) => t.pais === 'UY').map(fuenteVtex),
  ...OPEN_FACTS.map(fuenteOpenFacts),
  fuenteCosmos,
  ...TIENDAS_VTEX.filter((t) => t.pais !== 'UY').map(fuenteVtex),
  fuenteUpc,
]

export async function buscarProductoConDiagnostico(codigo: string): Promise<{ resultados: ResultadoProducto[]; fuentes: EstadoFuente[] }> {
  if (!/^\d{8,14}$/.test(codigo)) return { resultados: [], fuentes: [] }
  const salidas = await Promise.all(
    FUENTES.map(async (f): Promise<{ resultado?: ResultadoProducto; estado: EstadoFuente }> => {
      const inicio = Date.now()
      if (f.configurada && !f.configurada()) {
        return { estado: { fuente: f.id, estado: 'sin-configurar', detalle: 'falta el token', ms: 0 } }
      }
      try {
        const r = await f.buscar(codigo)
        const ms = Date.now() - inicio
        if (r && 'nombre' in r) return { resultado: r, estado: { fuente: f.id, estado: 'encontrado', ms } }
        if (r && !r.ok && !r.noEsta) return { estado: { fuente: f.id, estado: 'error', detalle: r.detalle, ms } }
        // "HTTP 404" en una tienda = catálogo público apagado; sin detalle = respondió y no lo tiene.
        return { estado: { fuente: f.id, estado: 'no-esta', detalle: r && !r.ok ? r.detalle : undefined, ms } }
      } catch (e) {
        return { estado: { fuente: f.id, estado: 'error', detalle: String(e), ms: Date.now() - inicio } }
      }
    }),
  )
  return {
    resultados: salidas.flatMap((s) => (s.resultado ? [s.resultado] : [])),
    fuentes: salidas.map((s) => s.estado),
  }
}

/** Devuelve todo lo encontrado, ordenado por preferencia. Lista vacía = no está en ninguna fuente. */
export async function buscarProducto(codigo: string): Promise<ResultadoProducto[]> {
  return (await buscarProductoConDiagnostico(codigo)).resultados
}
