// Datos de ejemplo para probar la app mientras no está conectada la base local (RxDB) ni Supabase.
// Los precios son ilustrativos, no relevados.
import type { Equipo, ItemCatalogo, PuntoVenta, Receta } from '../lib/tipos'

const DIA = 24 * 60 * 60 * 1000
const hace = (dias: number) => new Date(Date.now() - dias * DIA).toISOString()

export const puntosEjemplo: PuntoVenta[] = [
  { id: 'feria', nombre: 'Feria Tristán Narvaja', mapsUrl: 'https://maps.google.com/?q=Feria+Tristan+Narvaja+Montevideo' },
  { id: 'don-pepe', nombre: 'Almacén Don Pepe' },
  { id: 'tienda-inglesa', nombre: 'Tienda Inglesa', mapsUrl: 'https://maps.google.com/?q=Tienda+Inglesa+Montevideo' },
  { id: 'devoto', nombre: 'Devoto Pocitos', mapsUrl: 'https://maps.google.com/?q=Devoto+Pocitos' },
  { id: 'reposteria', nombre: 'Casa de repostería' },
]

type ItemBase = Omit<ItemCatalogo, 'tipo' | 'usos' | 'merma'> & Partial<Pick<ItemCatalogo, 'usos' | 'merma'>>
const ing = (i: ItemBase): ItemCatalogo => ({ tipo: 'ingrediente', usos: [], merma: 0, ...i })
const ins = (i: ItemBase): ItemCatalogo => ({ tipo: 'insumo', usos: [], merma: 0, ...i })

// Cada precio es lo que se paga por la presentación (ej. $99 por 900 ml de aceite).
export const catalogoEjemplo: ItemCatalogo[] = [
  ing({
    id: 'zanahoria', nombre: 'Zanahoria', categoria: 'Verduras', presentacion: { cantidad: 1, unidad: 'kg' }, merma: 0.2,
    usos: ['Tortas', 'Muffins', 'Rallada'], tono: '#F2B880', puntoPreferidoId: 'don-pepe',
    precios: [
      { puntoId: 'feria', precio: 55, fecha: hace(3) },
      { puntoId: 'don-pepe', precio: 60, fecha: hace(7) },
      { puntoId: 'devoto', precio: 36, presentacion: { cantidad: 500, unidad: 'g' }, fecha: hace(45) },
    ],
  }),
  ing({
    id: 'harina', nombre: 'Harina 0000', marca: 'Cañuelas', codigo: '7730205033047', categoria: 'Harinas',
    presentacion: { cantidad: 1, unidad: 'kg' }, usos: ['Masas', 'Tortas'], tono: '#EDE2CB',
    precios: [{ puntoId: 'tienda-inglesa', precio: 45, fecha: hace(5) }],
  }),
  ing({ id: 'azucar', nombre: 'Azúcar', marca: 'Bella Unión', categoria: 'Azúcares', presentacion: { cantidad: 1, unidad: 'kg' }, tono: '#F1E9DA', precios: [{ puntoId: 'tienda-inglesa', precio: 50, fecha: hace(5) }] }),
  ing({ id: 'huevos', nombre: 'Huevos', categoria: 'Lácteos y huevos', presentacion: { cantidad: 30, unidad: 'u' }, tono: '#F3DDB0', precios: [{ puntoId: 'feria', precio: 270, fecha: hace(3) }] }),
  ing({ id: 'aceite', nombre: 'Aceite de girasol', marca: 'Óptimo', categoria: 'Aceites', presentacion: { cantidad: 900, unidad: 'ml' }, tono: '#F2D98C', precios: [{ puntoId: 'devoto', precio: 99, fecha: hace(10) }] }),
  ing({ id: 'nueces', nombre: 'Nueces', categoria: 'Frutos secos', presentacion: { cantidad: 200, unidad: 'g' }, tono: '#C99A6B', precios: [{ puntoId: 'devoto', precio: 128, fecha: hace(45) }] }),
  ing({ id: 'manteca', nombre: 'Manteca', marca: 'Conaprole', categoria: 'Lácteos y huevos', presentacion: { cantidad: 200, unidad: 'g' }, tono: '#F6E3A1', precios: [{ puntoId: 'tienda-inglesa', precio: 96, fecha: hace(5) }] }),
  ing({ id: 'limon', nombre: 'Limón', categoria: 'Frutas', presentacion: { cantidad: 1, unidad: 'u' }, tono: '#EFE0A8', precios: [{ puntoId: 'feria', precio: 12, fecha: hace(3) }] }),
  ing({ id: 'leche-condensada', nombre: 'Leche condensada (lata 395 g)', categoria: 'Lácteos y huevos', presentacion: { cantidad: 1, unidad: 'u' }, tono: '#F4EBD2', precios: [{ puntoId: 'tienda-inglesa', precio: 95, fecha: hace(5) }] }),
  ing({ id: 'maicena', nombre: 'Almidón de maíz', categoria: 'Harinas', presentacion: { cantidad: 500, unidad: 'g' }, tono: '#F4F0E6', precios: [{ puntoId: 'tienda-inglesa', precio: 60, fecha: hace(5) }] }),
  ing({ id: 'impalpable', nombre: 'Azúcar impalpable', categoria: 'Azúcares', presentacion: { cantidad: 500, unidad: 'g' }, tono: '#F7F2EA', precios: [{ puntoId: 'tienda-inglesa', precio: 45, fecha: hace(5) }] }),
  ing({ id: 'dulce-leche', nombre: 'Dulce de leche repostero', categoria: 'Lácteos y huevos', presentacion: { cantidad: 1, unidad: 'kg' }, tono: '#C98A4B', precios: [{ puntoId: 'tienda-inglesa', precio: 220, fecha: hace(5) }] }),
  ing({ id: 'coco', nombre: 'Coco rallado', categoria: 'Frutos secos', presentacion: { cantidad: 100, unidad: 'g' }, tono: '#F2EEE6', precios: [{ puntoId: 'tienda-inglesa', precio: 40, fecha: hace(5) }] }),
  ing({ id: 'naranja', nombre: 'Naranja', categoria: 'Frutas', presentacion: { cantidad: 1, unidad: 'u' }, tono: '#F2B36B', precios: [{ puntoId: 'feria', precio: 15, fecha: hace(3) }] }),
  ins({ id: 'bandeja-24', nombre: 'Bandeja de cartón 24 cm', categoria: 'Envases', presentacion: { cantidad: 1, unidad: 'u' }, tono: '#E2D3BC', precios: [{ puntoId: 'reposteria', precio: 35, fecha: hace(12) }] }),
  ins({ id: 'papel-manteca', nombre: 'Papel manteca (hoja)', categoria: 'Consumibles', presentacion: { cantidad: 50, unidad: 'u' }, tono: '#EEE6D6', precios: [{ puntoId: 'reposteria', precio: 200, fecha: hace(12) }] }),
  ins({ id: 'bolsa-celofan', nombre: 'Bolsa de celofán', categoria: 'Envases', presentacion: { cantidad: 100, unidad: 'u' }, tono: '#E6EEF0', precios: [{ puntoId: 'reposteria', precio: 200, fecha: hace(12) }] }),
]

export const equiposEjemplo: Equipo[] = [
  { id: 'horno-gas', nombre: 'Horno a gas', energia: 'gas', costoHora: 48 },
  { id: 'batidora', nombre: 'Batidora eléctrica', energia: 'electricidad', costoHora: 6 },
]

let n = 0
const id = () => `l${++n}`

export const recetasEjemplo: Receta[] = [
  {
    id: 'torta-zanahoria', tipo: 'receta', nombre: 'Torta de zanahoria', categoria: 'Dulce', estado: 'probada', tono: '#E8B36A',
    rendimiento: { tipo: 'peso', totalGramos: 1560, porcionGramos: 130 },
    lineas: [
      { id: id(), itemId: 'zanahoria', cantidad: 300, unidad: 'g', nota: 'rallada fina' },
      { id: id(), itemId: 'harina', cantidad: 250, unidad: 'g' },
      { id: id(), itemId: 'azucar', cantidad: 200, unidad: 'g' },
      { id: id(), itemId: 'huevos', cantidad: 3, unidad: 'u' },
      { id: id(), itemId: 'aceite', cantidad: 150, unidad: 'ml' },
      { id: id(), itemId: 'nueces', cantidad: 80, unidad: 'g' },
      { id: id(), itemId: 'bandeja-24', cantidad: 1, unidad: 'u' },
      { id: id(), itemId: 'papel-manteca', cantidad: 1, unidad: 'u' },
    ],
    pasos: [
      { id: 'p1', texto: 'Rallar las zanahorias', minutos: 15 },
      { id: 'p2', texto: 'Mezclar secos y húmedos', minutos: 10 },
      { id: 'p3', texto: 'Preparar el molde', minutos: 5 },
      { id: 'p4', texto: 'Hornear', minutos: 45, equipoId: 'horno-gas' },
    ],
  },
  {
    id: 'alfajores', tipo: 'receta', nombre: 'Alfajores de maicena', categoria: 'Dulce', estado: 'lista', tono: '#EFE0A8',
    rendimiento: { tipo: 'unidades', cantidad: 24 },
    precioVenta: { precio: 50, metodo: { tipo: 'manual', valor: 50 } },
    lineas: [
      { id: id(), itemId: 'maicena', cantidad: 300, unidad: 'g' },
      { id: id(), itemId: 'harina', cantidad: 200, unidad: 'g' },
      { id: id(), itemId: 'manteca', cantidad: 200, unidad: 'g' },
      { id: id(), itemId: 'impalpable', cantidad: 100, unidad: 'g' },
      { id: id(), itemId: 'huevos', cantidad: 3, unidad: 'u' },
      { id: id(), itemId: 'dulce-leche', cantidad: 500, unidad: 'g' },
      { id: id(), itemId: 'coco', cantidad: 50, unidad: 'g' },
      { id: id(), itemId: 'bolsa-celofan', cantidad: 24, unidad: 'u' },
    ],
    pasos: [
      { id: 'p1', texto: 'Batir manteca y azúcar', minutos: 10, equipoId: 'batidora' },
      { id: 'p2', texto: 'Estirar y cortar tapitas', minutos: 25 },
      { id: 'p3', texto: 'Hornear', minutos: 15, equipoId: 'horno-gas' },
      { id: 'p4', texto: 'Rellenar y pasar por coco', minutos: 30 },
    ],
  },
  {
    id: 'lemon-pie', tipo: 'receta', nombre: 'Lemon pie', categoria: 'Dulce', estado: 'probada', tono: '#F2E9C4',
    rendimiento: { tipo: 'peso', totalGramos: 1200, porcionGramos: 150 },
    precioVenta: { precio: 140, metodo: { tipo: 'manual', valor: 140 } },
    lineas: [
      { id: id(), itemId: 'harina', cantidad: 200, unidad: 'g' },
      { id: id(), itemId: 'manteca', cantidad: 150, unidad: 'g' },
      { id: id(), itemId: 'azucar', cantidad: 300, unidad: 'g' },
      { id: id(), itemId: 'huevos', cantidad: 5, unidad: 'u' },
      { id: id(), itemId: 'limon', cantidad: 4, unidad: 'u' },
      { id: id(), itemId: 'leche-condensada', cantidad: 1, unidad: 'u' },
      { id: id(), itemId: 'bandeja-24', cantidad: 1, unidad: 'u' },
    ],
    pasos: [
      { id: 'p1', texto: 'Masa y blind baking', minutos: 30, equipoId: 'horno-gas' },
      { id: 'p2', texto: 'Crema de limón', minutos: 15 },
      { id: 'p3', texto: 'Merengue', minutos: 10, equipoId: 'batidora' },
    ],
  },
  {
    id: 'budin-naranja', tipo: 'receta', nombre: 'Budín de naranja', categoria: 'Dulce', estado: 'idea', tono: '#EDE5D6',
    rendimiento: { tipo: 'peso', totalGramos: 900, porcionGramos: 90 },
    lineas: [
      { id: id(), itemId: 'harina', cantidad: 250, unidad: 'g' },
      { id: id(), itemId: 'azucar', cantidad: 200, unidad: 'g' },
      { id: id(), itemId: 'huevos', cantidad: 3, unidad: 'u' },
      { id: id(), itemId: 'naranja', cantidad: 2, unidad: 'u' },
      { id: id(), itemId: 'aceite', cantidad: 100, unidad: 'ml' },
    ],
    pasos: [
      { id: 'p1', texto: 'Mezclar', minutos: 15 },
      { id: 'p2', texto: 'Hornear', minutos: 50, equipoId: 'horno-gas' },
    ],
  },
]
