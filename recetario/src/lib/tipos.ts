import type { MetodoPrecio, Presentacion, Unidad } from './costeo'

export type Estado = 'idea' | 'probada' | 'lista'

export interface PuntoVenta {
  id: string
  nombre: string
  mapsUrl?: string
  notas?: string
}

export interface PrecioEnPunto {
  puntoId: string
  /** Lo que se pagó por la presentación (ej. $99 por 900 ml). */
  precio: number
  /** Si en este punto se vende en otro tamaño que el habitual del producto. */
  presentacion?: Presentacion
  fecha: string // ISO
  fuente?: 'manual' | 'web' // 'web' = tomado de la tienda online del supermercado
}

export interface ItemCatalogo {
  id: string
  tipo: 'ingrediente' | 'insumo'
  nombre: string
  marca?: string
  codigo?: string
  categoria: string
  /** Presentación habitual de compra: 1 kg, 500 g, 900 ml, 30 u… */
  presentacion: Presentacion
  merma: number // 0–1
  coccionMin?: number
  usos: string[]
  precios: PrecioEnPunto[]
  puntoPreferidoId?: string
  /** Color del recuadro mientras no hay foto. */
  tono: string
  foto?: string
}

export interface Equipo {
  id: string
  nombre: string
  energia: 'gas' | 'electricidad'
  costoHora: number
}

export interface LineaReceta {
  id: string
  itemId: string
  cantidad: number
  unidad: Unidad
  merma?: number // si difiere de la del catálogo
  puntoId?: string // si difiere del preferido
  nota?: string
}

export interface Paso {
  id: string
  texto: string
  minutos: number
  equipoId?: string
}

export type Rendimiento =
  | { tipo: 'peso'; totalGramos: number; porcionGramos: number }
  | { tipo: 'unidades'; cantidad: number }

export interface Receta {
  id: string
  tipo: 'receta' // futuro: 'evento', 'inventario'
  nombre: string
  categoria: string
  estado: Estado
  rendimiento: Rendimiento
  lineas: LineaReceta[]
  pasos: Paso[]
  precioVenta?: { precio: number; metodo: MetodoPrecio }
  notas?: string
  tono: string
  foto?: string
}

export interface Configuracion {
  foodCostObjetivo: number
  recargoRapido: number
  diasPrecioViejo: number
}
