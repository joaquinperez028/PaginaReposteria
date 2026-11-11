import { useState } from 'react'
import { useDatos } from '../data/almacen'
import { HojaInferior, Lista, Miniatura, Nota, Seccion } from '../components/comunes'
import { CamposCompra, type DatosCompra } from '../components/FormCompra'
import { textoPresentacion } from '../lib/presentacion'
import { IconoAtras, IconoCamara } from '../components/Iconos'
import { costoAprovechable, unidadesCompatibles } from '../lib/costeo'
import { costo, haceDias, numero, pesos, porcentaje } from '../lib/formato'
import { diasDesde, masBarato, precioBase, precioParaCosteo, presentacionDe, unidadBase, usosDeItem } from '../lib/receta'

export function FichaIngrediente({ id }: { id?: string }) {
  const { catalogo, recetas, equipos, puntos, config, despachar } = useDatos()
  const item = catalogo.find((i) => i.id === id)
  const [hoja, setHoja] = useState<null | { puntoId?: string }>(null)
  const [compra, setCompra] = useState<DatosCompra | null>(null)

  if (!item) {
    return (
      <div className="p-6">
        <a href="#/ingredientes" className="font-semibold">‹ Volver</a>
        <p>No encontramos ese ingrediente.</p>
      </div>
    )
  }

  const usado = precioParaCosteo(item)
  const barato = masBarato(item)
  const usos = usosDeItem(item.id, recetas, catalogo, equipos)
  const precios = [...item.precios].sort((a, b) => precioBase(item, a) - precioBase(item, b))
  const base = unidadBase(item)
  const unidad = { kg: 'kg', l: 'litro', u: 'unidad' }[base]
  const abreviada = { kg: 'kg', l: 'l', u: 'u' }[base]
  const enEdicion = hoja?.puntoId ? item.precios.find((p) => p.puntoId === hoja.puntoId) : undefined

  return (
    <div className="flex flex-col pb-10">
      <div className="relative h-[200px] shrink-0 overflow-hidden">
        <Miniatura nombre={item.nombre} tono={item.tono} foto={item.foto} className="h-full w-full text-7xl" />
        <div className="absolute inset-x-3 top-3.5 flex justify-between">
          <button
            onClick={() => history.back()}
            aria-label="Volver"
            className="flex size-11 items-center justify-center rounded-[14px] bg-tarjeta text-cacao"
          >
            <IconoAtras tam={20} />
          </button>
          <button aria-label="Cambiar foto" className="flex size-11 items-center justify-center rounded-[14px] bg-tarjeta text-cacao">
            <IconoCamara tam={20} />
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-2.5 px-5 pb-1 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-cacao px-2 py-0.5 text-xs font-semibold text-fondo">
            {item.tipo === 'insumo' ? 'Insumo' : 'Ingrediente'}
          </span>
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-tinta-suave">{item.categoria}</span>
          <span className="numeros text-[13px] text-tinta-suave">· {item.codigo ?? 'Sin código de barras'}</span>
        </div>
        <h1 className="m-0 font-display text-[34px] font-semibold leading-[1.05]">{item.nombre}</h1>
        {item.marca && <span className="-mt-1 text-[15px] text-tinta-media">{item.marca}</span>}
        {item.usos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.usos.map((u) => (
              <span key={u} className="rounded-full border border-borde-fuerte px-2.5 py-1 text-[13px]">
                {u}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="numeros mx-4 mt-4 grid grid-cols-2 gap-2.5">
        <div className="col-span-2 flex flex-col gap-1 rounded-2xl bg-cacao p-3.5 text-fondo">
          <span className="font-sans text-[13px] opacity-80">Costo por {unidad} aprovechable</span>
          {usado ? (
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="text-[40px] font-medium leading-none">{pesos(costoAprovechable(precioBase(item, usado), item.merma))}</span>
              <span className="text-sm opacity-80">
                {item.merma > 0
                  ? `${pesos(precioBase(item, usado))}/${abreviada} ÷ (1 − ${porcentaje(item.merma, 0)} de merma)`
                  : `${pesos(usado.precio)} por ${textoPresentacion(presentacionDe(item, usado))}`}
              </span>
            </div>
          ) : (
            <span className="text-lg">Cargá un precio para calcularlo</span>
          )}
        </div>
        <Dato titulo="Merma por defecto" valor={porcentaje(item.merma, 0)} />
        <Dato titulo="Se compra en" valor={textoPresentacion(item.presentacion)} />
        <Dato titulo="Cocción por defecto" valor={item.coccionMin ? `${item.coccionMin} min` : '—'} />
        <div className="flex flex-col gap-0.5 rounded-2xl border border-dashed border-borde-fuerte bg-tarjeta px-3.5 py-3">
          <span className="font-sans text-xs text-tinta-suave">Referencia SIPC</span>
          <span className="font-sans text-sm font-medium text-tinta-media">Al conectar SIPC</span>
        </div>
      </section>

      <Seccion titulo="Dónde comprar" extra={<span className="text-[13px] text-tinta-suave">{precios.length} puntos de venta</span>}>
        {precios.length > 0 ? (
          <Lista>
            {precios.map((p) => {
              const punto = puntos.find((x) => x.id === p.puntoId)
              const dias = diasDesde(p.fecha)
              const viejo = dias > config.diasPrecioViejo
              const esUsado = usado?.puntoId === p.puntoId
              const esBarato = barato?.puntoId === p.puntoId && precios.length > 1
              return (
                <div key={p.puntoId} className={`flex items-center justify-between gap-3 px-3.5 py-3 ${viejo ? 'bg-aviso-suave' : ''}`}>
                  <span className="flex flex-col gap-1">
                    <span className="font-sans text-base font-medium">{punto?.nombre ?? 'Punto de venta'}</span>
                    <span className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[13px] ${viejo ? 'text-aviso' : 'text-tinta-suave'}`}>
                      {viejo && <span className="rounded-[5px] bg-aviso-fondo px-1.5 text-xs font-semibold text-aviso">Desactualizado</span>}
                      {!viejo && esBarato && <span className="rounded-[5px] bg-pistacho-claro px-1.5 text-xs font-semibold text-pistacho">Más barato</span>}
                      {!viejo && esUsado && !esBarato && <span className="rounded-[5px] bg-cacao px-1.5 text-xs font-semibold text-fondo">Usado en costeo</span>}
                      {haceDias(dias)}
                      {punto?.mapsUrl && (
                        <>
                          {' · '}
                          <a href={punto.mapsUrl} target="_blank" rel="noreferrer" className="text-frutilla">
                            Maps
                          </a>
                        </>
                      )}
                      {viejo && <Nota>¡revisar!</Nota>}
                    </span>
                  </span>
                  <button
                    onClick={() => setHoja({ puntoId: p.puntoId })}
                    aria-label={`Editar precio en ${punto?.nombre ?? 'este lugar'}`}
                    className="flex flex-col items-end text-right"
                  >
                    <span className="text-lg font-medium">{pesos(p.precio)}</span>
                    <span className="text-xs text-tinta-suave">
                      {textoPresentacion(presentacionDe(item, p))}
                      {base !== 'u' || presentacionDe(item, p).cantidad !== 1 ? ` · ${pesos(precioBase(item, p))}/${abreviada}` : ''}
                    </span>
                  </button>
                </div>
              )
            })}
          </Lista>
        ) : (
          <p className="m-0 rounded-[18px] border border-dashed border-borde-fuerte px-4 py-5 text-center text-tinta-suave">Todavía no cargaste dónde comprarlo.</p>
        )}
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <button onClick={() => setHoja({})} className="h-[52px] rounded-[14px] border-[1.5px] border-borde-fuerte bg-tarjeta text-[15px] font-semibold">
            + Punto de venta
          </button>
          <button
            onClick={() => setHoja({ puntoId: usado?.puntoId })}
            className="h-[52px] rounded-[14px] bg-frutilla text-[15px] font-semibold text-tarjeta"
          >
            Actualizar precio
          </button>
        </div>
      </Seccion>

      <Seccion titulo={usos.length === 1 ? 'Usado en 1 receta' : `Usado en ${usos.length} recetas`}>
        {usos.length > 0 ? (
          <Lista>
            {usos.map(({ receta, linea, costo: c }) => (
              <a key={linea.id} href={`#/receta/${receta.id}`} className="flex items-center justify-between px-3.5 py-3 text-cacao no-underline">
                <span className="flex flex-col gap-0.5">
                  <span className="font-sans text-base font-medium">{receta.nombre}</span>
                  <span className="text-[13px] text-tinta-suave">
                    {numero(linea.cantidad)} {linea.unidad}
                  </span>
                </span>
                <span className="text-base font-medium">{costo(c)} ›</span>
              </a>
            ))}
          </Lista>
        ) : (
          <p className="m-0 text-tinta-suave">Todavía no está en ninguna receta.</p>
        )}
      </Seccion>
      {hoja && (
        <HojaInferior titulo={enEdicion ? 'Actualizar precio' : 'Nuevo precio'} alCerrar={() => setHoja(null)}>
          <CamposCompra
            key={hoja.puntoId ?? 'nuevo'}
            precioObligatorio
            unidadesPermitidas={unidadesCompatibles(base)}
            inicial={{ presentacion: presentacionDe(item, enEdicion), precio: enEdicion?.precio, puntoId: hoja.puntoId }}
            onCambio={setCompra}
          />
          <button
            disabled={!compra?.precio}
            onClick={() => {
              if (!compra?.precio) return
              despachar({ tipo: 'actualizarPrecio', itemId: item.id, precio: compra.precio, punto: compra.puntoNuevo })
              setHoja(null)
            }}
            className="h-14 rounded-2xl bg-frutilla text-base font-semibold text-tarjeta disabled:opacity-45"
          >
            Guardar precio
          </button>
        </HojaInferior>
      )}
    </div>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-borde bg-tarjeta px-3.5 py-3">
      <span className="font-sans text-xs text-tinta-suave">{titulo}</span>
      <span className="text-[22px] font-medium">{valor}</span>
    </div>
  )
}
