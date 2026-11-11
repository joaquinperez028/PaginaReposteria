// "¿Cuánto compraste, cuánto pagaste y dónde?" — se usa al cargar un producto y al actualizar un precio.
import { useEffect, useState } from 'react'
import { useDatos, nuevoId } from '../data/almacen'
import { baseDe, precioPorUnidadBase, type Presentacion, type Unidad } from '../lib/costeo'
import { costo } from '../lib/formato'
import type { PrecioEnPunto, PuntoVenta } from '../lib/tipos'

const UNIDADES: { u: Unidad; texto: string }[] = [
  { u: 'g', texto: 'g' },
  { u: 'kg', texto: 'kg' },
  { u: 'ml', texto: 'ml' },
  { u: 'l', texto: 'l' },
  { u: 'u', texto: 'unid.' },
]

const NOMBRE_BASE = { kg: 'kilo', l: 'litro', u: 'unidad' } as const

export interface DatosCompra {
  presentacion: Presentacion
  /** undefined si no se cargó precio */
  precio?: PrecioEnPunto
  /** punto nuevo creado en el formulario */
  puntoNuevo?: PuntoVenta
}

const numero = (t: string) => Number(t.replace(',', '.'))

/**
 * Campos de compra. `unidadesPermitidas` limita las unidades cuando el producto ya existe
 * (un producto que se compra por peso no puede pasar a litros sin romper las recetas).
 */
export function CamposCompra({
  inicial,
  precioObligatorio = false,
  unidadesPermitidas,
  onCambio,
}: {
  inicial?: { presentacion?: Presentacion; precio?: number; puntoId?: string; puntoNombre?: string }
  precioObligatorio?: boolean
  unidadesPermitidas?: Unidad[]
  onCambio: (datos: DatosCompra | null) => void
}) {
  const { puntos } = useDatos()
  const [cantidad, setCantidad] = useState(inicial?.presentacion ? String(inicial.presentacion.cantidad) : '')
  const [unidad, setUnidad] = useState<Unidad>(inicial?.presentacion?.unidad ?? unidadesPermitidas?.[0] ?? 'g')
  const [precio, setPrecio] = useState(inicial?.precio ? String(inicial.precio) : '')
  const [puntoId, setPuntoId] = useState(inicial?.puntoId ?? (inicial?.puntoNombre ? '__nuevo' : puntos[0]?.id ?? '__nuevo'))
  const [puntoNombre, setPuntoNombre] = useState(inicial?.puntoNombre ?? '')

  const cantidadOk = numero(cantidad) > 0
  const precioOk = numero(precio) > 0
  const presentacion: Presentacion | undefined = cantidadOk ? { cantidad: numero(cantidad), unidad } : undefined
  const porBase = presentacion && precioOk ? precioPorUnidadBase(numero(precio), presentacion) : undefined

  // Calcula el resultado y avisa al formulario padre en cada cambio.
  function emitir(c = cantidad, u = unidad, p = precio, pid = puntoId, pn = puntoNombre) {
    const pres = numero(c) > 0 ? { cantidad: numero(c), unidad: u } : undefined
    const conPrecio = numero(p) > 0
    if (!pres || (precioObligatorio && !conPrecio) || (conPrecio && pid === '__nuevo' && !pn.trim())) {
      onCambio(null)
      return
    }
    if (!conPrecio) {
      onCambio({ presentacion: pres })
      return
    }
    const puntoNuevo = pid === '__nuevo' ? { id: `p-${nuevoId()}`, nombre: pn.trim() } : undefined
    onCambio({
      presentacion: pres,
      puntoNuevo,
      precio: { puntoId: puntoNuevo?.id ?? pid, precio: numero(p), presentacion: pres, fecha: new Date().toISOString(), fuente: 'manual' },
    })
  }

  useEffect(() => emitir(), []) // valores iniciales

  const campo = 'h-[52px] w-full min-w-0 rounded-[14px] border-[1.5px] border-borde-fuerte bg-tarjeta px-3.5 text-cacao outline-none focus:border-frutilla'
  const disponibles = UNIDADES.filter((x) => !unidadesPermitidas || unidadesPermitidas.includes(x.u))

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
        <legend className="mb-1.5 text-[13px] font-medium text-tinta-media">Lo que comprás (el paquete o la cantidad)</legend>
        <div className="flex gap-2">
          <label className="w-28 shrink-0">
            <span className="solo-lector">Cantidad comprada</span>
            <input
              inputMode="decimal"
              value={cantidad}
              placeholder="500"
              onChange={(e) => {
                setCantidad(e.target.value)
                emitir(e.target.value)
              }}
              className={`numeros text-xl ${campo}`}
            />
          </label>
          <div role="radiogroup" aria-label="Unidad de compra" className="flex flex-1 gap-1">
            {disponibles.map(({ u, texto }) => (
              <button
                type="button"
                role="radio"
                aria-checked={unidad === u}
                key={u}
                onClick={() => {
                  setUnidad(u)
                  emitir(cantidad, u)
                }}
                className={`h-[52px] flex-1 rounded-xl text-[15px] font-semibold ${
                  unidad === u ? 'bg-cacao text-fondo' : 'border-[1.5px] border-borde-fuerte bg-tarjeta text-cacao'
                }`}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <div className="flex gap-2">
        <label className="flex w-36 shrink-0 flex-col gap-1.5 text-[13px] font-medium text-tinta-media">
          Precio pagado
          <span className={`flex items-center gap-1 ${campo}`}>
            <span className="numeros text-lg text-tinta-suave">$</span>
            <input
              inputMode="decimal"
              value={precio}
              placeholder={precioObligatorio ? '' : 'opcional'}
              onChange={(e) => {
                setPrecio(e.target.value)
                emitir(cantidad, unidad, e.target.value)
              }}
              className="numeros w-full min-w-0 bg-transparent text-xl outline-none placeholder:text-base placeholder:text-tinta-suave"
            />
          </span>
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px] font-medium text-tinta-media">
          Dónde
          <select
            value={puntoId}
            onChange={(e) => {
              setPuntoId(e.target.value)
              emitir(cantidad, unidad, precio, e.target.value)
            }}
            className={`text-base ${campo}`}
          >
            {puntos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
            <option value="__nuevo">Otro lugar…</option>
          </select>
        </label>
      </div>

      {puntoId === '__nuevo' && (
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-tinta-media">
          Nombre del lugar
          <input
            value={puntoNombre}
            placeholder="Ej: Feria del Parque Rodó"
            onChange={(e) => {
              setPuntoNombre(e.target.value)
              emitir(cantidad, unidad, precio, puntoId, e.target.value)
            }}
            className={`text-base ${campo}`}
          />
        </label>
      )}

      {porBase !== undefined && presentacion && (
        <p className="numeros m-0 rounded-xl bg-pistacho-claro px-3 py-2 text-sm text-pistacho-osc">
          = {costo(porBase)} por {NOMBRE_BASE[baseDe(presentacion.unidad)]}
        </p>
      )}
    </div>
  )
}
