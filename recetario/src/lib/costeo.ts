// Fórmulas de costeo (DECISIONES.md §6). Funciones puras, sin dependencias, cubiertas por tests.

export type Unidad = 'g' | 'kg' | 'ml' | 'l' | 'u'
export type UnidadCompra = 'kg' | 'l' | 'u'

const CONVERSION: Record<Unidad, { base: UnidadCompra; factor: number }> = {
  g: { base: 'kg', factor: 0.001 },
  kg: { base: 'kg', factor: 1 },
  ml: { base: 'l', factor: 0.001 },
  l: { base: 'l', factor: 1 },
  u: { base: 'u', factor: 1 },
}

/** Unidades que se pueden usar en una receta para un producto que se compra en `unidadCompra`. */
export function unidadesCompatibles(unidadCompra: UnidadCompra): Unidad[] {
  return (Object.keys(CONVERSION) as Unidad[]).filter((u) => CONVERSION[u].base === unidadCompra)
}

/** Convierte una cantidad (ej. 300 g) a la unidad en que se compra el producto (ej. 0,3 kg). */
export function enUnidadCompra(cantidad: number, unidad: Unidad, unidadCompra: UnidadCompra): number {
  const { base, factor } = CONVERSION[unidad]
  if (base !== unidadCompra) {
    throw new Error(`No se puede convertir ${unidad} a ${unidadCompra}`)
  }
  return cantidad * factor
}

/** Unidad base en la que se calculan los costos: g→kg, ml→l, u→u. */
export function baseDe(unidad: Unidad): UnidadCompra {
  return CONVERSION[unidad].base
}

/** Lo que se compra: "500 g", "900 ml", "1 kg", "30 u" (un maple de huevos). */
export interface Presentacion {
  cantidad: number
  unidad: Unidad
}

/** Precio por unidad base a partir del precio de la presentación: $99 por 900 ml → $110/l. */
export function precioPorUnidadBase(precio: number, presentacion: Presentacion): number {
  const cantidadBase = enUnidadCompra(presentacion.cantidad, presentacion.unidad, baseDe(presentacion.unidad))
  if (!(cantidadBase > 0)) throw new Error('La presentación debe tener una cantidad mayor a cero')
  return precio / cantidadBase
}

/** Precio por unidad aprovechable: precio de compra ÷ (1 − merma). */
export function costoAprovechable(precioCompra: number, merma: number): number {
  if (merma < 0 || merma >= 1) throw new Error('La merma debe estar entre 0% y 99%')
  return precioCompra / (1 - merma)
}

/** Costo de una línea de la receta, con la cantidad expresada como aprovechable. */
export function costoLinea(
  cantidad: number,
  unidad: Unidad,
  precioPorUnidadCompra: number,
  unidadCompra: UnidadCompra,
  merma = 0,
): number {
  return enUnidadCompra(cantidad, unidad, unidadCompra) * costoAprovechable(precioPorUnidadCompra, merma)
}

/** Costo de energía de un paso: minutos × costo por hora del equipo. */
export function costoEnergia(minutos: number, costoHora: number): number {
  return (minutos / 60) * costoHora
}

export type MetodoPrecio =
  | { tipo: 'foodCost'; valor: number } // 0,30 = el costo es el 30% del precio
  | { tipo: 'recargo'; valor: number } // 0,70 = costo + 70%
  | { tipo: 'multiplicador'; valor: number } // 3 = costo × 3
  | { tipo: 'manual'; valor: number } // precio escrito a mano

export function precioPorMetodo(costoPorcion: number, metodo: MetodoPrecio): number {
  switch (metodo.tipo) {
    case 'foodCost':
      if (metodo.valor <= 0 || metodo.valor >= 1) throw new Error('El food cost debe estar entre 1% y 99%')
      return costoPorcion / metodo.valor
    case 'recargo':
      return costoPorcion * (1 + metodo.valor)
    case 'multiplicador':
      return costoPorcion * metodo.valor
    case 'manual':
      return metodo.valor
  }
}

/** Redondea hacia arriba a un número vendible: de a $5 hasta $100, de a $10 hasta $1.000, de a $50 después. */
export function redondearVendible(precio: number): number {
  if (precio <= 0) return 0
  const paso = precio < 100 ? 5 : precio < 1000 ? 10 : 50
  return Math.ceil(precio / paso - 1e-9) * paso
}

export interface AnalisisPrecio {
  gananciaPorcion: number
  gananciaReceta: number
  /** Proporción del precio que se va en costos (0–1). */
  foodCost: number
}

export function analizarPrecio(precio: number, costoPorcion: number, porciones: number): AnalisisPrecio {
  const gananciaPorcion = precio - costoPorcion
  return {
    gananciaPorcion,
    gananciaReceta: gananciaPorcion * porciones,
    foodCost: precio > 0 ? costoPorcion / precio : Number.NaN,
  }
}

/** Agrega IVA (apagado por defecto en la app). */
export function conIva(precio: number, tasa: number): number {
  return precio * (1 + tasa)
}
