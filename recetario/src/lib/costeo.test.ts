import { describe, expect, it } from 'vitest'
import {
  analizarPrecio,
  costoAprovechable,
  costoEnergia,
  costoLinea,
  enUnidadCompra,
  precioPorUnidadBase,
  precioPorMetodo,
  redondearVendible,
} from './costeo'
import { calcularReceta } from './receta'
import { parsearPresentacion } from './presentacion'
import { catalogoEjemplo, equiposEjemplo, recetasEjemplo } from '../data/ejemplo'

describe('costeo por ingrediente', () => {
  it('aplica la merma: 1 kg de zanahoria a $60 con 20% → $75/kg aprovechable', () => {
    expect(costoAprovechable(60, 0.2)).toBeCloseTo(75)
  })

  it('300 g de zanahoria cuestan $22,50', () => {
    expect(costoLinea(300, 'g', 60, 'kg', 0.2)).toBeCloseTo(22.5)
  })

  it('convierte ml a litros', () => {
    expect(enUnidadCompra(150, 'ml', 'l')).toBeCloseTo(0.15)
  })

  it('rechaza conversiones imposibles', () => {
    expect(() => enUnidadCompra(3, 'u', 'kg')).toThrow()
  })

  it('rechaza mermas fuera de rango', () => {
    expect(() => costoAprovechable(60, 1)).toThrow()
  })
})

describe('energía', () => {
  it('horno a gas 45 min a $48/h → $36', () => {
    expect(costoEnergia(45, 48)).toBeCloseTo(36)
  })
})

describe('precio de venta', () => {
  it('recargo ≠ margen: costo $100 + 70% = $170; food cost 30% = $333,33', () => {
    expect(precioPorMetodo(100, { tipo: 'recargo', valor: 0.7 })).toBeCloseTo(170)
    expect(precioPorMetodo(100, { tipo: 'foodCost', valor: 0.3 })).toBeCloseTo(333.33, 2)
    expect(analizarPrecio(170, 100, 1).foodCost).toBeCloseTo(0.588, 3)
  })

  it('multiplicador y manual', () => {
    expect(precioPorMetodo(20, { tipo: 'multiplicador', valor: 3 })).toBe(60)
    expect(precioPorMetodo(20, { tipo: 'manual', valor: 75 })).toBe(75)
  })

  it('redondea a un número vendible', () => {
    expect(redondearVendible(59.29)).toBe(60)
    expect(redondearVendible(60)).toBe(60)
    expect(redondearVendible(137.33)).toBe(140)
    expect(redondearVendible(1012)).toBe(1050)
  })
})

describe('receta de ejemplo: torta de zanahoria', () => {
  const torta = recetasEjemplo.find((r) => r.id === 'torta-zanahoria')!
  const calc = calcularReceta(torta, catalogoEjemplo, equiposEjemplo)

  it('suma ingredientes, insumos y energía', () => {
    expect(calc.subtotalIngredientes).toBeCloseTo(138.45)
    expect(calc.subtotalInsumos).toBeCloseTo(39)
    expect(calc.subtotalEnergia).toBeCloseTo(36)
    expect(calc.total).toBeCloseTo(213.45)
  })

  it('12 porciones de 130 g → $17,79 por porción, sugerido $60', () => {
    expect(calc.porciones).toBe(12)
    expect(calc.costoPorcion).toBeCloseTo(17.79, 2)
    expect(redondearVendible(precioPorMetodo(calc.costoPorcion, { tipo: 'foodCost', valor: 0.3 }))).toBe(60)
  })

  it('a $60: gana $42,21 por porción y $506,55 por receta, food cost 29,6%', () => {
    const a = analizarPrecio(60, calc.costoPorcion, calc.porciones)
    expect(a.gananciaPorcion).toBeCloseTo(42.21, 2)
    expect(a.gananciaReceta).toBeCloseTo(506.55, 2)
    expect(a.foodCost).toBeCloseTo(0.296, 3)
  })
})

describe('presentaciones', () => {
  it('$99 por 900 ml → $110 por litro', () => {
    expect(precioPorUnidadBase(99, { cantidad: 900, unidad: 'ml' })).toBeCloseTo(110)
  })
  it('maple de 30 huevos a $270 → $9 cada uno', () => {
    expect(precioPorUnidadBase(270, { cantidad: 30, unidad: 'u' })).toBeCloseTo(9)
  })
  it('lee la presentación de un texto', () => {
    expect(parsearPresentacion('Aceite Óptimo 1,5 L')?.cantidad).toBeCloseTo(1.5)
    expect(parsearPresentacion('900 ml')?.unidad).toBe('ml')
    expect(parsearPresentacion('6 x 500 g')?.cantidad).toBe(3000)
    expect(parsearPresentacion('sin cantidad')).toBe(undefined)
  })
})
