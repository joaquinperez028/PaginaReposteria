import { useMemo, useState } from 'react'
import { useDatos } from '../data/almacen'
import { BarraInferior } from '../components/BarraInferior'
import { AvisoInstalar } from '../components/AvisoInstalar'
import { InsigniaEstado, Miniatura, NOMBRE_ESTADO, useEnLinea } from '../components/comunes'
import { IconoAjustes, IconoBuscar, IconoMas } from '../components/Iconos'
import { analizarPrecio, precioPorMetodo, redondearVendible } from '../lib/costeo'
import { costo, pesos, porcentaje } from '../lib/formato'
import { calcularReceta } from '../lib/receta'
import type { Estado } from '../lib/tipos'

type Filtro = Estado | 'todas'

export function ListaRecetas() {
  const { recetas, catalogo, equipos, config } = useDatos()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [busqueda, setBusqueda] = useState('')
  const enLinea = useEnLinea()

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return recetas
      .filter((r) => filtro === 'todas' || r.estado === filtro)
      .filter((r) => {
        if (!q) return true
        if (r.nombre.toLowerCase().includes(q)) return true
        return r.lineas.some((l) => catalogo.find((i) => i.id === l.itemId)?.nombre.toLowerCase().includes(q))
      })
      .map((receta) => {
        const calc = calcularReceta(receta, catalogo, equipos)
        const sugerido = redondearVendible(
          precioPorMetodo(calc.costoPorcion, { tipo: 'foodCost', valor: config.foodCostObjetivo }),
        )
        const precio = receta.precioVenta?.precio
        return {
          receta,
          calc,
          precio,
          sugerido,
          foodCost: precio ? analizarPrecio(precio, calc.costoPorcion, calc.porciones).foodCost : undefined,
        }
      })
  }, [recetas, catalogo, equipos, config, filtro, busqueda])

  const chip = (valor: Filtro, texto: string) => (
    <button
      key={valor}
      onClick={() => setFiltro(valor)}
      aria-pressed={filtro === valor}
      className={`h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 text-sm ${
        filtro === valor ? 'bg-cacao font-medium text-fondo' : 'border border-borde-fuerte text-cacao'
      }`}
    >
      {texto}
    </button>
  )

  return (
    <div className="flex min-h-dvh flex-col pb-28">
      <header className="flex flex-col gap-3.5 px-5 pb-3 pt-6">
        <div className="flex items-center justify-between">
          {enLinea ? (
            <span className="text-sm text-tinta-suave">Espacio compartido</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-aviso-fondo px-2.5 py-1.5 text-[13px] font-medium text-aviso">
              <span className="size-2 rounded-full bg-aviso" />
              Sin conexión · se guarda en el teléfono
            </span>
          )}
          <a
            href="#/ajustes"
            aria-label="Configuración"
            className="flex size-11 items-center justify-center rounded-xl border border-borde bg-tarjeta text-cacao"
          >
            <IconoAjustes tam={20} />
          </a>
        </div>
        <h1 className="m-0 font-display text-4xl font-semibold leading-[1.05] tracking-tight">Mis recetas</h1>
        <span className="-mt-3 -rotate-[1.5deg] self-start font-mano text-2xl font-bold text-frutilla">
          probar, costear, vender
        </span>
        <label className="flex h-12 items-center gap-2.5 rounded-[14px] border border-borde bg-tarjeta px-3.5 text-tinta-suave">
          <IconoBuscar tam={18} />
          <span className="solo-lector">Buscar receta</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar receta o ingrediente"
            className="flex-1 bg-transparent text-base text-cacao outline-none placeholder:text-tinta-suave"
          />
        </label>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
          {chip('todas', `Todas · ${recetas.length}`)}
          {(Object.keys(NOMBRE_ESTADO) as Estado[]).map((e) => chip(e, NOMBRE_ESTADO[e]))}
        </div>
      </header>

      <AvisoInstalar />

      <main className="flex flex-col gap-2.5 px-4 pt-2.5">
        {filas.length === 0 && (
          <p className="px-2 py-8 text-center text-tinta-suave">No hay recetas con ese filtro.</p>
        )}
        {filas.map(({ receta, calc, precio, sugerido, foodCost }) => (
          <a
            key={receta.id}
            href={`#/receta/${receta.id}`}
            className={`flex items-center gap-3.5 rounded-[18px] p-3 text-cacao no-underline ${
              receta.estado === 'idea' ? 'border border-dashed border-borde-fuerte' : 'border border-borde bg-tarjeta'
            }`}
          >
            <Miniatura nombre={receta.nombre} tono={receta.tono} foto={receta.foto} className="size-16 shrink-0 rounded-[14px] text-2xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-display text-[19px] font-semibold leading-tight">{receta.nombre}</span>
              <span className="text-[13px] text-tinta-suave">
                {receta.rendimiento.tipo === 'peso'
                  ? `${calc.porciones} porciones · ${receta.rendimiento.porcionGramos} g`
                  : `${calc.porciones} unidades`}
              </span>
              <InsigniaEstado estado={receta.estado} />
            </div>
            <div className="numeros flex flex-col items-end gap-0.5 text-right">
              <span className="text-xs text-tinta-suave">Costo {costo(calc.costoPorcion)}</span>
              {precio ? (
                <>
                  <span className="text-[22px] font-medium">{pesos(precio)}</span>
                  <span className="text-xs text-tinta-suave">FC {porcentaje(foodCost!)}</span>
                </>
              ) : (
                <>
                  <span className="text-[22px] font-medium text-tinta-media">{pesos(sugerido)}</span>
                  <span className="text-xs text-tinta-suave">sugerido</span>
                </>
              )}
            </div>
          </a>
        ))}

        <button className="mt-1 flex h-[52px] items-center justify-center gap-2 rounded-2xl border-[1.5px] border-frutilla font-semibold text-frutilla">
          <IconoMas tam={18} />
          Nueva receta
        </button>
      </main>

      <BarraInferior activa="recetas" />
    </div>
  )
}
