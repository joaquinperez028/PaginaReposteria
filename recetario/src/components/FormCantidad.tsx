import { useState, type ReactNode } from 'react'
import { unidadesCompatibles, type Unidad } from '../lib/costeo'
import type { ItemCatalogo } from '../lib/tipos'
import { unidadBase } from '../lib/receta'

const ETIQUETA: Record<Unidad, string> = { g: 'g', kg: 'kg', ml: 'ml', l: 'l', u: 'u' }

/** Cantidad aprovechable + unidad, con las unidades compatibles con cómo se compra el producto. */
export function FormCantidad({
  item,
  textoBoton,
  alConfirmar,
  secundario,
}: {
  item: ItemCatalogo
  textoBoton: string
  alConfirmar: (cantidad: number, unidad: Unidad) => void
  secundario?: ReactNode
}) {
  const unidades = unidadesCompatibles(unidadBase(item))
  const [unidad, setUnidad] = useState<Unidad>(unidades.includes('g') ? 'g' : unidades.includes('ml') ? 'ml' : unidades[0])
  const [texto, setTexto] = useState('')
  const cantidad = Number(texto.replace(',', '.'))
  const valida = texto !== '' && Number.isFinite(cantidad) && cantidad > 0

  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={(e) => {
        e.preventDefault()
        if (valida) alConfirmar(cantidad, unidad)
      }}
    >
      <div className="flex items-end gap-2.5">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px] font-medium text-tinta-media">
          Cantidad aprovechable
          <input
            inputMode="decimal"
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="0"
            className="numeros h-[52px] w-full min-w-0 rounded-[14px] border-[1.5px] border-borde-fuerte bg-tarjeta px-3.5 text-[22px] font-medium text-cacao outline-none focus:border-frutilla"
          />
        </label>
        <label className="flex w-24 shrink-0 flex-col gap-1.5 text-[13px] font-medium text-tinta-media">
          Unidad
          <select
            value={unidad}
            onChange={(e) => setUnidad(e.target.value as Unidad)}
            className="h-[52px] rounded-[14px] border-[1.5px] border-borde-fuerte bg-tarjeta px-2.5 text-lg text-cacao"
          >
            {unidades.map((u) => (
              <option key={u} value={u}>
                {ETIQUETA[u]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex gap-2.5">
        {secundario}
        <button
          type="submit"
          disabled={!valida}
          className="h-14 flex-[2] rounded-2xl bg-frutilla text-base font-semibold text-tarjeta disabled:opacity-45"
        >
          {textoBoton}
        </button>
      </div>
    </form>
  )
}
