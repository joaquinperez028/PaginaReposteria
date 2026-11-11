import { baseDe, costoEnergia, costoLinea, precioPorUnidadBase, type Presentacion, type UnidadCompra } from './costeo'
import type { Equipo, ItemCatalogo, LineaReceta, Paso, PrecioEnPunto, Receta } from './tipos'

const DIA = 24 * 60 * 60 * 1000

export function diasDesde(fechaIso: string, ahora = Date.now()): number {
  return Math.max(0, Math.floor((ahora - new Date(fechaIso).getTime()) / DIA))
}

/** Precio que se usa para costear: el del punto elegido en la línea, si no el preferido, si no el más barato. */
export function precioParaCosteo(item: ItemCatalogo, puntoId?: string): PrecioEnPunto | undefined {
  const buscado = puntoId ?? item.puntoPreferidoId
  return item.precios.find((p) => p.puntoId === buscado) ?? masBarato(item)
}

/** El más barato comparando por unidad base (un paquete de 500 g y uno de 1 kg se comparan por kilo). */
export function masBarato(item: ItemCatalogo): PrecioEnPunto | undefined {
  return item.precios.reduce<PrecioEnPunto | undefined>(
    (min, p) => (!min || precioBase(item, p) < precioBase(item, min) ? p : min),
    undefined,
  )
}

/** kg, l o u: la unidad en que se expresan los costos de este producto. */
export function unidadBase(item: ItemCatalogo): UnidadCompra {
  return baseDe(item.presentacion.unidad)
}

/** La presentación de ese precio (puede diferir de la habitual del producto). */
export function presentacionDe(item: ItemCatalogo, precio?: PrecioEnPunto): Presentacion {
  return precio?.presentacion ?? item.presentacion
}

/** Precio por kg, l o unidad de un precio cargado. */
export function precioBase(item: ItemCatalogo, precio: PrecioEnPunto): number {
  return precioPorUnidadBase(precio.precio, presentacionDe(item, precio))
}

export function porciones(receta: Receta): number {
  return receta.rendimiento.tipo === 'peso'
    ? Math.floor(receta.rendimiento.totalGramos / receta.rendimiento.porcionGramos)
    : receta.rendimiento.cantidad
}

export interface LineaCalculada {
  linea: LineaReceta
  item: ItemCatalogo
  precio?: PrecioEnPunto
  merma: number
  costo: number
}

export interface EnergiaCalculada {
  paso: Paso
  equipo: Equipo
  costo: number
}

export interface RecetaCalculada {
  ingredientes: LineaCalculada[]
  insumos: LineaCalculada[]
  energia: EnergiaCalculada[]
  subtotalIngredientes: number
  subtotalInsumos: number
  subtotalEnergia: number
  total: number
  porciones: number
  costoPorcion: number
  minutosTotales: number
  /** Líneas sin precio cargado: el costo está incompleto. */
  sinPrecio: LineaCalculada[]
}

const suma = (xs: { costo: number }[]) => xs.reduce((t, x) => t + x.costo, 0)

export function calcularReceta(receta: Receta, catalogo: ItemCatalogo[], equipos: Equipo[]): RecetaCalculada {
  const lineas: LineaCalculada[] = []
  for (const linea of receta.lineas) {
    const item = catalogo.find((i) => i.id === linea.itemId)
    if (!item) continue
    const precio = precioParaCosteo(item, linea.puntoId)
    const merma = linea.merma ?? item.merma
    const costo = precio ? costoLinea(linea.cantidad, linea.unidad, precioBase(item, precio), unidadBase(item), merma) : 0
    lineas.push({ linea, item, precio, merma, costo })
  }
  const energia: EnergiaCalculada[] = []
  for (const paso of receta.pasos) {
    const equipo = equipos.find((e) => e.id === paso.equipoId)
    if (equipo) energia.push({ paso, equipo, costo: costoEnergia(paso.minutos, equipo.costoHora) })
  }
  const ingredientes = lineas.filter((l) => l.item.tipo === 'ingrediente')
  const insumos = lineas.filter((l) => l.item.tipo === 'insumo')
  const total = suma(lineas) + suma(energia)
  const n = porciones(receta)
  return {
    ingredientes,
    insumos,
    energia,
    subtotalIngredientes: suma(ingredientes),
    subtotalInsumos: suma(insumos),
    subtotalEnergia: suma(energia),
    total,
    porciones: n,
    costoPorcion: n > 0 ? total / n : 0,
    minutosTotales: receta.pasos.reduce((t, p) => t + p.minutos, 0),
    sinPrecio: lineas.filter((l) => !l.precio),
  }
}

/** Recetas que usan un ítem del catálogo, con la cantidad y el costo en cada una. */
export function usosDeItem(itemId: string, recetas: Receta[], catalogo: ItemCatalogo[], equipos: Equipo[]) {
  return recetas.flatMap((receta) => {
    const calc = calcularReceta(receta, catalogo, equipos)
    return [...calc.ingredientes, ...calc.insumos]
      .filter((l) => l.item.id === itemId)
      .map((l) => ({ receta, linea: l.linea, costo: l.costo }))
  })
}
