import { useMemo, useState } from 'react'
import { nuevoId, useDatos } from '../data/almacen'
import type { ItemCatalogo } from '../lib/tipos'
import { HojaInferior, Miniatura } from './comunes'
import { FormCantidad } from './FormCantidad'
import { IconoBuscar } from './Iconos'

export function BuscarCatalogo({ recetaId, alCerrar }: { recetaId: string; alCerrar: () => void }) {
  const { catalogo, despachar } = useDatos()
  const [q, setQ] = useState('')
  const [elegido, setElegido] = useState<ItemCatalogo>()

  const resultados = useMemo(() => {
    const t = q.trim().toLowerCase()
    return catalogo.filter((i) => !t || i.nombre.toLowerCase().includes(t) || i.marca?.toLowerCase().includes(t)).slice(0, 12)
  }, [catalogo, q])

  return (
    <HojaInferior titulo={elegido ? elegido.nombre : 'Buscar en el catálogo'} alCerrar={alCerrar}>
      {elegido ? (
        <FormCantidad
          item={elegido}
          textoBoton="Agregar a la receta"
          secundario={
            <button type="button" onClick={() => setElegido(undefined)} className="h-14 flex-1 rounded-2xl border-[1.5px] border-borde-fuerte font-semibold">
              Volver
            </button>
          }
          alConfirmar={(cantidad, unidad) => {
            despachar({ tipo: 'agregarLinea', recetaId, linea: { id: nuevoId(), itemId: elegido.id, cantidad, unidad } })
            alCerrar()
          }}
        />
      ) : (
        <>
          <label className="flex h-12 items-center gap-2.5 rounded-[14px] border border-borde bg-tarjeta px-3.5 text-tinta-suave">
            <IconoBuscar tam={18} />
            <span className="solo-lector">Buscar ingrediente o insumo</span>
            <input
              autoFocus
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej: harina, bandeja…"
              className="flex-1 bg-transparent text-base text-cacao outline-none placeholder:text-tinta-suave"
            />
          </label>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {resultados.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setElegido(item)}
                  className="flex w-full items-center gap-3 rounded-[14px] border border-borde bg-tarjeta p-2.5 text-left"
                >
                  <Miniatura nombre={item.nombre} tono={item.tono} foto={item.foto} className="size-11 shrink-0 rounded-[10px] text-lg" />
                  <span className="flex flex-1 flex-col">
                    <span className="font-medium">{item.nombre}</span>
                    <span className="text-[13px] text-tinta-suave">
                      {item.tipo === 'insumo' ? 'Insumo' : item.categoria}
                      {item.marca ? ` · ${item.marca}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {resultados.length === 0 && <li className="py-4 text-center text-tinta-suave">No está en el catálogo. Probá escaneando.</li>}
          </ul>
        </>
      )}
    </HojaInferior>
  )
}
