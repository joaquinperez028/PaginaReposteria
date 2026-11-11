import { useMemo, useState } from 'react'
import { useDatos } from '../data/almacen'
import { BarraInferior } from '../components/BarraInferior'
import { Miniatura } from '../components/comunes'
import { IconoBuscar } from '../components/Iconos'
import { pesos } from '../lib/formato'
import { diasDesde, precioParaCosteo, presentacionDe } from '../lib/receta'
import { textoPresentacion } from '../lib/presentacion'

export function ListaIngredientes() {
  const { catalogo, config } = useDatos()
  const [q, setQ] = useState('')
  const filas = useMemo(() => {
    const t = q.trim().toLowerCase()
    return catalogo
      .filter((i) => !t || i.nombre.toLowerCase().includes(t))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [catalogo, q])

  return (
    <div className="flex min-h-dvh flex-col pb-28">
      <header className="flex flex-col gap-3.5 px-5 pb-3 pt-6">
        <h1 className="m-0 font-display text-4xl font-semibold leading-[1.05] tracking-tight">Ingredientes</h1>
        <label className="flex h-12 items-center gap-2.5 rounded-[14px] border border-borde bg-tarjeta px-3.5 text-tinta-suave">
          <IconoBuscar tam={18} />
          <span className="solo-lector">Buscar en el catálogo</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en el catálogo"
            className="flex-1 bg-transparent text-base text-cacao outline-none placeholder:text-tinta-suave"
          />
        </label>
      </header>
      <ul className="m-0 flex list-none flex-col gap-2 px-4 pt-1">
        {filas.map((item) => {
          const p = precioParaCosteo(item)
          const viejo = p ? diasDesde(p.fecha) > config.diasPrecioViejo : false
          return (
            <li key={item.id}>
              <a href={`#/ingrediente/${item.id}`} className="flex items-center gap-3 rounded-2xl border border-borde bg-tarjeta p-2.5 text-cacao no-underline">
                <Miniatura nombre={item.nombre} tono={item.tono} foto={item.foto} className="size-12 shrink-0 rounded-xl text-xl" />
                <span className="flex flex-1 flex-col">
                  <span className="font-medium">{item.nombre}</span>
                  <span className="text-[13px] text-tinta-suave">{item.tipo === 'insumo' ? 'Insumo' : item.categoria}</span>
                </span>
                <span className={`numeros text-right text-[15px] ${viejo ? 'text-aviso' : ''}`}>
                  {p ? (
                    <>
                      {pesos(p.precio)}
                      <span className="block text-xs text-tinta-suave">{textoPresentacion(presentacionDe(item, p))}</span>
                    </>
                  ) : (
                    'sin precio'
                  )}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
      <BarraInferior activa="ingredientes" />
    </div>
  )
}
