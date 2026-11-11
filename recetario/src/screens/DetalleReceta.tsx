import { useState } from 'react'
import { useDatos } from '../data/almacen'
import { InsigniaEstado, Lista, Miniatura, Nota, Seccion } from '../components/comunes'
import { BuscarCatalogo } from '../components/BuscarCatalogo'
import { PanelCalcular } from '../components/PanelCalcular'
import { IconoAtras, IconoBuscar, IconoEditar, IconoEscanear } from '../components/Iconos'
import { analizarPrecio, precioPorMetodo, redondearVendible } from '../lib/costeo'
import { costo, duracion, numero, pesos, porcentaje } from '../lib/formato'
import { calcularReceta, diasDesde, type LineaCalculada } from '../lib/receta'

export function DetalleReceta({ id }: { id?: string }) {
  const { recetas, catalogo, equipos, puntos, config, despachar } = useDatos()
  const receta = recetas.find((r) => r.id === id)
  const [verInfo, setVerInfo] = useState(false)
  const [calcular, setCalcular] = useState(false)
  const [buscar, setBuscar] = useState(false)
  const [verPasos, setVerPasos] = useState(false)

  if (!receta) {
    return (
      <div className="p-6">
        <a href="#/" className="font-semibold">‹ Volver</a>
        <p>No encontramos esa receta.</p>
      </div>
    )
  }

  const calc = calcularReceta(receta, catalogo, equipos)
  const sugerido = redondearVendible(precioPorMetodo(calc.costoPorcion, { tipo: 'foodCost', valor: config.foodCostObjetivo }))
  const sugeridoCrudo = precioPorMetodo(calc.costoPorcion, { tipo: 'foodCost', valor: config.foodCostObjetivo })
  const elegido = receta.precioVenta?.precio
  const precio = elegido ?? sugerido
  const analisis = analizarPrecio(precio, calc.costoPorcion, calc.porciones)
  const fc = Math.round(config.foodCostObjetivo * 100)
  const pct = (x: number) => (calc.total > 0 ? (x / calc.total) * 100 : 0)
  const nombrePunto = (pid?: string) => puntos.find((p) => p.id === pid)?.nombre

  const filaLinea = ({ linea, item, precio: p, merma, costo: c }: LineaCalculada) => {
    const viejo = p ? diasDesde(p.fecha) > config.diasPrecioViejo : false
    const partes = [
      `${numero(linea.cantidad)} ${linea.unidad === 'u' ? (linea.cantidad === 1 ? 'unidad' : 'unidades') : linea.unidad}`,
      merma > 0 ? `merma ${porcentaje(merma, 0)}` : null,
      viejo && p ? `precio de hace ${diasDesde(p.fecha)} días` : nombrePunto(p?.puntoId),
    ].filter(Boolean)
    return (
      <a
        key={linea.id}
        href={`#/ingrediente/${item.id}`}
        className={`flex items-center justify-between gap-3 px-3.5 py-3 text-cacao no-underline ${viejo ? 'bg-aviso-suave' : ''}`}
      >
        <span className="flex flex-col gap-0.5">
          <span className="font-sans text-base font-medium">{item.nombre}</span>
          <span className={`font-sans text-[13px] ${viejo ? 'text-aviso' : 'text-tinta-suave'}`}>
            {p ? partes.join(' · ') : 'Sin precio cargado'} {viejo && <Nota>¡actualizar!</Nota>}
          </span>
        </span>
        <span className="text-base font-medium">{p ? costo(c) : '—'}</span>
      </a>
    )
  }

  return (
    <div className="flex flex-col pb-10">
      <div className="relative h-[220px] shrink-0 overflow-hidden">
        <Miniatura nombre={receta.nombre} tono={receta.tono} foto={receta.foto} className="h-full w-full text-7xl" />
        <div className="absolute inset-x-3 top-3.5 flex justify-between">
          <a href="#/" aria-label="Volver a recetas" className="flex size-11 items-center justify-center rounded-[14px] bg-tarjeta text-cacao">
            <IconoAtras tam={20} />
          </a>
          <button aria-label="Editar receta" className="flex size-11 items-center justify-center rounded-[14px] bg-tarjeta text-cacao">
            <IconoEditar tam={20} />
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-2.5 px-5 pb-2 pt-5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-tinta-suave">{receta.categoria}</span>
          <InsigniaEstado estado={receta.estado} />
        </div>
        <h1 className="m-0 font-display text-[34px] font-semibold leading-[1.05]">{receta.nombre}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-tinta-media [font-variant-numeric:tabular-nums]">
          <span>
            {receta.rendimiento.tipo === 'peso'
              ? `${calc.porciones} porciones de ${receta.rendimiento.porcionGramos} g`
              : `${calc.porciones} unidades`}
          </span>
          {receta.rendimiento.tipo === 'peso' && <span>{numero(receta.rendimiento.totalGramos / 1000)} kg</span>}
          <span>{duracion(calc.minutosTotales)}</span>
        </div>
      </section>

      {/* Tarjeta del precio: lo más importante de la pantalla. Borde punteado tipo ticket. */}
      <section className="mx-4 mt-3 flex flex-col gap-3.5 rounded-[22px] border-2 border-dashed border-cacao bg-tarjeta p-[18px]">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-tinta-media">
            {elegido ? 'Tu precio por porción' : 'Precio sugerido por porción'}
          </span>
          <button
            aria-label="Qué es el food cost"
            aria-expanded={verInfo}
            onClick={() => setVerInfo(!verInfo)}
            className="flex size-7 items-center justify-center rounded-full border-[1.5px] border-frutilla text-sm font-bold italic text-frutilla"
          >
            i
          </button>
        </div>
        {verInfo && (
          <div className="rounded-xl bg-cacao px-3.5 py-3 text-[13px] leading-[1.45] text-fondo">
            <strong>Food cost</strong> es la parte del precio que se va en costos. {fc}% es el estándar en gastronomía:
            de cada $100 que cobrás, ${fc} pagan ingredientes, envases y energía.
          </div>
        )}
        <div className="numeros flex flex-wrap items-baseline gap-x-2.5">
          <span className="text-[64px] font-medium leading-none tracking-tight">{pesos(precio)}</span>
          <span className="text-sm text-tinta-suave">
            {elegido ? `sugerido ${pesos(sugerido)} · FC ${porcentaje(analisis.foodCost)}` : `food cost ${fc}% · calculado ${costo(sugeridoCrudo)}`}
          </span>
        </div>
        {calc.sinPrecio.length > 0 && (
          <p className="m-0 rounded-xl bg-aviso-fondo px-3 py-2 text-[13px] font-medium text-aviso">
            Faltan precios de {calc.sinPrecio.map((l) => l.item.nombre).join(', ')}: el costo está incompleto.
          </p>
        )}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-0.5 rounded-xl bg-fondo p-2.5">
            <span className="text-xs leading-tight text-tinta-suave">Costo / porción</span>
            <span className="numeros text-lg font-medium">{costo(calc.costoPorcion)}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-pistacho-claro p-2.5">
            <span className="text-xs leading-tight text-pistacho">Ganancia / porción</span>
            <span className="numeros text-lg font-medium text-pistacho-osc">{costo(analisis.gananciaPorcion)}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-pistacho-claro p-2.5">
            <span className="text-xs leading-tight text-pistacho">Ganancia receta</span>
            <span className="numeros text-lg font-medium text-pistacho-osc">{costo(analisis.gananciaReceta)}</span>
          </div>
        </div>
        <button onClick={() => setCalcular(true)} className="h-[52px] rounded-[14px] border-[1.5px] border-cacao text-base font-semibold text-cacao">
          Calcular de otra manera
        </button>
        <span className="text-center text-xs text-tinta-suave">Recargo, food cost propio, multiplicador o un precio a mano</span>
      </section>

      <section className="mx-4 mt-5 flex flex-col gap-2.5">
        <div className="numeros flex items-baseline justify-between">
          <h2 className="m-0 font-display text-[22px] font-semibold">Costo de la receta</h2>
          <span className="text-xl font-medium">{costo(calc.total)}</span>
        </div>
        <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-[7px]" role="img" aria-label="Reparto del costo">
          <div className="bg-frutilla" style={{ width: `${pct(calc.subtotalIngredientes)}%` }} />
          <div className="bg-dulce" style={{ width: `${pct(calc.subtotalInsumos)}%` }} />
          <div className="bg-crema-tostada" style={{ width: `${pct(calc.subtotalEnergia)}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Leyenda color="bg-frutilla" titulo="Ingredientes" valor={pesos(calc.subtotalIngredientes)} />
          <Leyenda color="bg-dulce" titulo="Insumos" valor={pesos(calc.subtotalInsumos)} />
          <Leyenda color="bg-crema-tostada" titulo="Energía" valor={pesos(calc.subtotalEnergia)} />
        </div>
      </section>

      <Seccion titulo="Ingredientes">
        <Lista>{calc.ingredientes.map(filaLinea)}</Lista>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setBuscar(true)}
            className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-borde-fuerte bg-tarjeta text-[15px] font-semibold"
          >
            <IconoBuscar tam={18} />
            Buscar
          </button>
          <a
            href={`#/escanear?receta=${receta.id}`}
            className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-frutilla text-[15px] font-semibold text-tarjeta no-underline"
          >
            <IconoEscanear tam={18} />
            Escanear
          </a>
        </div>
      </Seccion>

      {calc.insumos.length > 0 && (
        <Seccion titulo="Insumos y envases">
          <Lista>{calc.insumos.map(filaLinea)}</Lista>
        </Seccion>
      )}

      {calc.energia.length > 0 && (
        <Seccion titulo="Energía">
          <Lista>
            {calc.energia.map(({ paso, equipo, costo: c }, i) => (
              <div key={paso.id} className="flex items-center justify-between px-3.5 py-3">
                <span className="flex flex-col gap-0.5">
                  <span className="font-sans text-base font-medium">
                    {equipo.nombre} · {paso.minutos} min
                  </span>
                  <span className="font-sans text-[13px] text-tinta-suave">
                    Paso {receta.pasos.indexOf(paso) + 1 || i + 1} «{paso.texto}» · {pesos(equipo.costoHora)} por hora
                  </span>
                </span>
                <span className="text-base font-medium">{costo(c)}</span>
              </div>
            ))}
          </Lista>
        </Seccion>
      )}

      <section className="mx-4 mt-6">
        <button
          aria-expanded={verPasos}
          onClick={() => setVerPasos(!verPasos)}
          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-[18px] border border-borde bg-tarjeta px-4 text-left"
        >
          <span className="font-display text-xl font-semibold">Pasos</span>
          <span className="whitespace-nowrap text-sm text-tinta-suave">
            {receta.pasos.length} pasos · {duracion(calc.minutosTotales)} {verPasos ? '▴' : '›'}
          </span>
        </button>
        {verPasos && (
          <ol className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
            {receta.pasos.map((p, i) => (
              <li key={p.id} className="flex gap-3 rounded-[14px] bg-tarjeta px-4 py-3">
                <span className="font-display text-xl font-bold text-frutilla">{i + 1}</span>
                <span className="flex flex-1 flex-col">
                  <span className="font-medium">{p.texto}</span>
                  <span className="text-[13px] text-tinta-suave">
                    {p.minutos} min{p.equipoId ? ` · ${equipos.find((e) => e.id === p.equipoId)?.nombre}` : ''}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {calcular && (
        <PanelCalcular
          costoPorcion={calc.costoPorcion}
          porciones={calc.porciones}
          recargoRapido={config.recargoRapido}
          inicial={receta.precioVenta?.metodo}
          alCerrar={() => setCalcular(false)}
          alGuardar={(p, metodo) => {
            despachar({ tipo: 'guardarPrecio', recetaId: receta.id, precio: p, metodo })
            setCalcular(false)
          }}
        />
      )}
      {buscar && <BuscarCatalogo recetaId={receta.id} alCerrar={() => setBuscar(false)} />}
    </div>
  )
}

function Leyenda({ color, titulo, valor }: { color: string; titulo: string; valor: string }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5 text-[13px] text-tinta-media">
        <span className={`size-2.5 shrink-0 rounded-[3px] ${color}`} />
        {titulo}
      </span>
      <span className="numeros pl-4 text-[15px] font-medium">{valor}</span>
    </span>
  )
}
