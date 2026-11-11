// Estado de la app en memoria. Próximo paso: reemplazar por RxDB (offline) + replicación con Supabase.
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react'
import type { MetodoPrecio } from '../lib/costeo'
import type { Configuracion, Equipo, ItemCatalogo, LineaReceta, PrecioEnPunto, PuntoVenta, Receta } from '../lib/tipos'
import { catalogoEjemplo, equiposEjemplo, puntosEjemplo, recetasEjemplo } from './ejemplo'

interface Estado {
  recetas: Receta[]
  catalogo: ItemCatalogo[]
  puntos: PuntoVenta[]
  equipos: Equipo[]
  config: Configuracion
}

type Accion =
  | { tipo: 'guardarPrecio'; recetaId: string; precio: number; metodo: MetodoPrecio }
  | { tipo: 'agregarLinea'; recetaId: string; linea: LineaReceta }
  | { tipo: 'agregarItem'; item: ItemCatalogo; punto?: PuntoVenta }
  /** Carga o reemplaza el precio de un producto en un punto de venta (crea el punto si es nuevo). */
  | { tipo: 'actualizarPrecio'; itemId: string; precio: PrecioEnPunto; punto?: PuntoVenta; usarEnCosteo?: boolean }

function conPunto(puntos: PuntoVenta[], punto?: PuntoVenta) {
  return punto && !puntos.some((p) => p.id === punto.id) ? [...puntos, punto] : puntos
}

function reducir(estado: Estado, accion: Accion): Estado {
  switch (accion.tipo) {
    case 'actualizarPrecio':
      return {
        ...estado,
        puntos: conPunto(estado.puntos, accion.punto),
        catalogo: estado.catalogo.map((i) =>
          i.id === accion.itemId
            ? {
                ...i,
                precios: [...i.precios.filter((p) => p.puntoId !== accion.precio.puntoId), accion.precio],
                puntoPreferidoId: accion.usarEnCosteo || !i.puntoPreferidoId ? accion.precio.puntoId : i.puntoPreferidoId,
              }
            : i,
        ),
      }
    case 'guardarPrecio':
      return {
        ...estado,
        recetas: estado.recetas.map((r) =>
          r.id === accion.recetaId ? { ...r, precioVenta: { precio: accion.precio, metodo: accion.metodo } } : r,
        ),
      }
    case 'agregarLinea':
      return {
        ...estado,
        recetas: estado.recetas.map((r) =>
          r.id === accion.recetaId ? { ...r, lineas: [...r.lineas, accion.linea] } : r,
        ),
      }
    case 'agregarItem':
      return { ...estado, puntos: conPunto(estado.puntos, accion.punto), catalogo: [...estado.catalogo, accion.item] }
  }
}

const inicial: Estado = {
  recetas: recetasEjemplo,
  catalogo: catalogoEjemplo,
  puntos: puntosEjemplo,
  equipos: equiposEjemplo,
  config: { foodCostObjetivo: 0.3, recargoRapido: 0.7, diasPrecioViejo: 30 },
}

const Contexto = createContext<(Estado & { despachar: (a: Accion) => void }) | null>(null)

export function ProveedorDatos({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(reducir, inicial)
  const valor = useMemo(() => ({ ...estado, despachar }), [estado])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useDatos() {
  const v = useContext(Contexto)
  if (!v) throw new Error('useDatos fuera de ProveedorDatos')
  return v
}

export const nuevoId = () => Math.random().toString(36).slice(2, 10)
