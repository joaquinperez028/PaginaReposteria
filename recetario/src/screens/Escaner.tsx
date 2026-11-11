import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { nuevoId, useDatos } from '../data/almacen'
import { Miniatura } from '../components/comunes'
import { FormCantidad } from '../components/FormCantidad'
import { IconoCamara, IconoCambiarCamara, IconoCerrar, IconoCheck, IconoLinterna, IconoTeclado } from '../components/Iconos'
import { avisarDeteccion, leerDeImagen, useLectorCodigos } from '../escaner/lector'
import { buscarProductoEnFuentes, type ResultadoProducto } from '../escaner/buscarProducto'
import { CamposCompra, type DatosCompra } from '../components/FormCompra'
import type { Unidad } from '../lib/costeo'
import { textoPresentacion } from '../lib/presentacion'
import { pesos } from '../lib/formato'
import { precioParaCosteo, presentacionDe } from '../lib/receta'
import type { ItemCatalogo, PuntoVenta } from '../lib/tipos'

type Hoja =
  | { tipo: 'catalogo'; codigo: string; item: ItemCatalogo }
  | { tipo: 'buscando'; codigo: string }
  | { tipo: 'nuevo'; codigo: string; resultados: ResultadoProducto[]; pendiente: boolean }
  | { tipo: 'manual' }

/** 7730205033047 → "7 730205 033047" (formato de la etiqueta EAN-13). */
const legible = (c: string) => (c.length === 13 ? `${c[0]} ${c.slice(1, 7)} ${c.slice(7)}` : c)

export function Escaner({ recetaId, demo }: { recetaId?: string; demo?: string }) {
  const { recetas, catalogo, despachar } = useDatos()
  const receta = recetas.find((r) => r.id === recetaId)
  const [hoja, setHoja] = useState<Hoja | null>(null)
  const [rafaga, setRafaga] = useState(true)
  const [agregados, setAgregados] = useState(0)
  const archivoRef = useRef<HTMLInputElement>(null)
  const volver = receta ? `#/receta/${receta.id}` : '#/'

  // Orden de búsqueda: catálogo propio → Open Food Facts → carga manual / pendiente.
  const manejarCodigo = useCallback(
    async (codigo: string) => {
      avisarDeteccion()
      const propio = catalogo.find((i) => i.codigo === codigo)
      if (propio) {
        setHoja({ tipo: 'catalogo', codigo, item: propio })
        return
      }
      setHoja({ tipo: 'buscando', codigo })
      try {
        const resultados = await buscarProductoEnFuentes(codigo)
        setHoja({ tipo: 'nuevo', codigo, resultados, pendiente: false })
      } catch {
        setHoja({ tipo: 'nuevo', codigo, resultados: [], pendiente: true })
      }
    },
    [catalogo],
  )

  const { videoRef, estado, linterna, alternarLinterna, cambiarCamara, variasCamaras } = useLectorCodigos(manejarCodigo, hoja !== null)

  useEffect(() => {
    // Para probar sin cámara: #/escanear?receta=torta-zanahoria&demo=7730205033047
    if (demo) void manejarCodigo(demo)
  }, []) // solo al abrir

  function agregar(item: ItemCatalogo, cantidad: number, unidad: Unidad) {
    if (!receta) return
    despachar({ tipo: 'agregarLinea', recetaId: receta.id, linea: { id: nuevoId(), itemId: item.id, cantidad, unidad } })
    setAgregados((n) => n + 1)
    if (rafaga) setHoja(null)
    else window.location.hash = volver
  }

  return (
    <div className="fixed inset-0 mx-auto max-w-[480px] overflow-hidden bg-noche text-[#F6EEE3]">
      <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />

      {estado !== 'activa' && estado !== 'iniciando' && (
        <div className="absolute left-1/2 top-[212px] z-10 flex w-[258px] -translate-x-1/2 flex-col gap-1.5 rounded-2xl bg-noche/90 px-3.5 py-3 text-center text-sm leading-snug">
          {estado === 'sin-permiso' && (
            <>
              <strong>La cámara está bloqueada</strong>
              <span className="text-[#E8DFD4]">
                En Chrome: tocá el ícono a la izquierda de la dirección › Permisos › Cámara › Permitir. Si sigue bloqueada,
                revisá Ajustes › Aplicaciones › Chrome › Permisos en el teléfono.
              </span>
            </>
          )}
          {estado === 'sin-camara' && <span>No encontramos una cámara disponible.</span>}
          {estado === 'inseguro' && (
            <>
              <strong>Chrome bloquea la cámara en esta dirección</strong>
              <span className="text-[#E8DFD4]">
                Abrí la app con HTTPS o en localhost, o agregá {window.location.origin} en
                chrome://flags › «Insecure origins treated as secure».
              </span>
            </>
          )}
          {estado === 'sin-lector' && (
            <span>La cámara funciona, pero no se pudo cargar el lector. Revisá la conexión y volvé a abrir el escáner, o escribí el código.</span>
          )}
          {estado === 'no-soportado' && <span>Este navegador no permite usar la cámara. Escribí el código o usá una foto.</span>}
        </div>
      )}

      <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2.5">
        <a href={volver} aria-label="Cerrar escáner" className="flex size-12 items-center justify-center rounded-2xl bg-black/45 text-[#F6EEE3]">
          <IconoCerrar />
        </a>
        <div className="flex flex-1 flex-col items-center gap-0.5 text-center">
          {receta ? (
            <>
              <span className="text-xs text-[#CFC4B8]">Agregando a</span>
              <span className="font-display text-[17px] font-semibold">{receta.nombre}</span>
            </>
          ) : (
            <span className="font-display text-[17px] font-semibold">Identificar producto</span>
          )}
        </div>
        <button
          aria-label={linterna.encendida ? 'Apagar linterna' : 'Encender linterna'}
          aria-pressed={linterna.encendida}
          disabled={!linterna.disponible}
          onClick={alternarLinterna}
          className={`flex size-12 items-center justify-center rounded-2xl disabled:opacity-40 ${
            linterna.encendida ? 'bg-manteca text-noche' : 'bg-black/45 text-[#F6EEE3]'
          }`}
        >
          <IconoLinterna />
        </button>
      </div>

      {receta && (
        <div className="absolute inset-x-0 top-[84px] flex justify-center">
          <button
            role="switch"
            aria-checked={rafaga}
            onClick={() => setRafaga(!rafaga)}
            className="flex h-9 items-center gap-2 rounded-full bg-[#F6EEE3] px-3.5 text-[13px] font-semibold text-[#2B1712]"
          >
            <span className={`relative inline-block h-4 w-7 rounded-full ${rafaga ? 'bg-[#3B5A1C]' : 'bg-[#B9AC9C]'}`}>
              <span className={`absolute top-0.5 size-3 rounded-full bg-[#FFFBF5] transition-[left] ${rafaga ? 'left-[14px]' : 'left-0.5'}`} />
            </span>
            Modo ráfaga{agregados > 0 ? ` · ${agregados} agregado${agregados === 1 ? '' : 's'}` : ''}
          </button>
        </div>
      )}

      {/* Recuadro guía */}
      <div className="pointer-events-none absolute left-1/2 top-[196px] h-[170px] w-[290px] -translate-x-1/2" aria-hidden="true">
        <div className="absolute left-0 top-0 size-9 rounded-tl-[14px] border-l-4 border-t-4 border-manteca" />
        <div className="absolute right-0 top-0 size-9 rounded-tr-[14px] border-r-4 border-t-4 border-manteca" />
        <div className="absolute bottom-0 left-0 size-9 rounded-bl-[14px] border-b-4 border-l-4 border-manteca" />
        <div className="absolute bottom-0 right-0 size-9 rounded-br-[14px] border-b-4 border-r-4 border-manteca" />
        {!hoja && estado === 'activa' && <div className="animar-escaneo absolute inset-x-3.5 top-[84px] h-0.5 bg-manteca shadow-[0_0_12px_#F6C25B]" />}
      </div>

      <p hidden={estado !== 'activa' && estado !== 'iniciando'} className="absolute inset-x-6 top-[384px] m-0 text-center text-[15px] leading-snug text-[#E8DFD4] [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
        Apuntá al código de barras.
        <br />
        Se lee solo, sin sacar foto.
      </p>

      <div className="absolute inset-x-0 top-[446px] flex justify-center gap-2">
        <button
          onClick={() => setHoja({ tipo: 'manual' })}
          className="flex h-11 items-center gap-2 rounded-full border border-[#5C524A] bg-black/35 px-4 text-sm font-medium"
        >
          <IconoTeclado tam={18} />
          ¿No lee? Escribir el código
        </button>
        {variasCamaras && (
          <button
            aria-label="Cambiar de cámara"
            title="Probá otra cámara si no enfoca"
            onClick={cambiarCamara}
            className="flex size-11 items-center justify-center rounded-full border border-[#5C524A] bg-black/35"
          >
            <IconoCambiarCamara tam={18} />
          </button>
        )}
        <button
          aria-label="Leer desde una foto"
          onClick={() => archivoRef.current?.click()}
          className="flex size-11 items-center justify-center rounded-full border border-[#5C524A] bg-black/35"
        >
          <IconoCamara tam={18} />
        </button>
        <input
          ref={archivoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const archivo = e.target.files?.[0]
            e.target.value = ''
            if (!archivo) return
            const codigo = await leerDeImagen(archivo).catch(() => undefined)
            if (codigo) void manejarCodigo(codigo)
            else alert('No encontramos un código en esa imagen.')
          }}
        />
      </div>

      {hoja && (
        <section
          aria-label="Producto detectado"
          className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col gap-3.5 overflow-y-auto rounded-t-[26px] bg-fondo px-[18px] pb-[max(24px,env(safe-area-inset-bottom))] pt-3 text-cacao"
        >
          <div className="h-[5px] w-10 self-center rounded-full bg-borde-fuerte" />
          {hoja.tipo === 'manual' ? (
            <CodigoManual alCancelar={() => setHoja(null)} alConfirmar={(c) => void manejarCodigo(c)} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-pistacho">
                  <IconoCheck tam={18} />
                  Detectado
                </span>
                <span className="numeros text-[13px] tracking-[0.04em] text-tinta-suave">{legible(hoja.codigo)}</span>
              </div>

              {hoja.tipo === 'buscando' && <p className="m-0 py-3 text-tinta-media">Buscando en Ta-Ta, El Dorado, Open Food Facts y UPCitemdb…</p>}

              {hoja.tipo === 'catalogo' && (
                <>
                  <ProductoFila
                    item={hoja.item}
                    insignia={<span className="rounded-md bg-pistacho-claro px-2 py-0.5 text-xs font-semibold text-pistacho">En tu catálogo</span>}
                  />
                  {receta ? (
                    <FormCantidad
                      key={hoja.codigo}
                      item={hoja.item}
                      textoBoton={rafaga ? 'Agregar y seguir' : 'Agregar'}
                      alConfirmar={(c, u) => agregar(hoja.item, c, u)}
                      secundario={
                        <a href={`#/ingrediente/${hoja.item.id}`} className="flex h-14 flex-1 items-center justify-center rounded-2xl border-[1.5px] border-borde-fuerte font-semibold text-cacao no-underline">
                          Ver ficha
                        </a>
                      }
                    />
                  ) : (
                    <div className="flex gap-2.5">
                      <button onClick={() => setHoja(null)} className="h-14 flex-1 rounded-2xl border-[1.5px] border-borde-fuerte font-semibold">
                        Seguir escaneando
                      </button>
                      <a href={`#/ingrediente/${hoja.item.id}`} className="flex h-14 flex-[2] items-center justify-center rounded-2xl bg-frutilla font-semibold text-tarjeta no-underline">
                        Ver ficha
                      </a>
                    </div>
                  )}
                </>
              )}

              {hoja.tipo === 'nuevo' && (
                <ProductoNuevo
                  key={hoja.codigo}
                  codigo={hoja.codigo}
                  resultados={hoja.resultados}
                  pendiente={hoja.pendiente}
                  conReceta={Boolean(receta)}
                  textoBoton={receta ? (rafaga ? 'Agregar y seguir' : 'Agregar') : 'Guardar en el catálogo'}
                  alCancelar={() => setHoja(null)}
                  alGuardar={(item, punto, cantidad, unidad) => {
                    despachar({ tipo: 'agregarItem', item, punto })
                    if (receta && cantidad && unidad) agregar(item, cantidad, unidad)
                    else setHoja({ tipo: 'catalogo', codigo: hoja.codigo, item })
                  }}
                />
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}

function ProductoFila({ item, insignia }: { item: ItemCatalogo; insignia: ReactNode }) {
  const precio = precioParaCosteo(item)
  return (
    <div className="flex items-center gap-3">
      <Miniatura nombre={item.nombre} tono={item.tono} foto={item.foto} className="size-14 shrink-0 rounded-xl text-2xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-display text-xl font-semibold leading-tight">{item.nombre}</span>
        <span className="text-[13px] text-tinta-suave">
          {[item.marca, textoPresentacion(presentacionDe(item, precio)), precio ? pesos(precio.precio) : 'sin precio']
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
      {insignia}
    </div>
  )
}

function CodigoManual({ alConfirmar, alCancelar }: { alConfirmar: (c: string) => void; alCancelar: () => void }) {
  const [codigo, setCodigo] = useState('')
  const valido = /^\d{8}$|^\d{12,13}$/.test(codigo)
  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={(e) => {
        e.preventDefault()
        if (valido) alConfirmar(codigo)
      }}
    >
      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-tinta-media">
        Número debajo de las barras
        <input
          autoFocus
          inputMode="numeric"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
          placeholder="7730000000000"
          className="numeros h-[52px] rounded-[14px] border-[1.5px] border-borde-fuerte bg-tarjeta px-3.5 text-xl text-cacao outline-none focus:border-frutilla"
        />
      </label>
      <div className="flex gap-2.5">
        <button type="button" onClick={alCancelar} className="h-14 flex-1 rounded-2xl border-[1.5px] border-borde-fuerte font-semibold">
          Cancelar
        </button>
        <button type="submit" disabled={!valido} className="h-14 flex-[2] rounded-2xl bg-frutilla font-semibold text-tarjeta disabled:opacity-45">
          Buscar código
        </button>
      </div>
    </form>
  )
}

function ProductoNuevo({
  codigo,
  resultados,
  pendiente,
  conReceta,
  textoBoton,
  alGuardar,
  alCancelar,
}: {
  codigo: string
  resultados: ResultadoProducto[]
  pendiente: boolean
  conReceta: boolean
  textoBoton: string
  alGuardar: (item: ItemCatalogo, punto?: PuntoVenta, cantidad?: number, unidad?: Unidad) => void
  alCancelar: () => void
}) {
  const { puntos } = useDatos()
  const principal = resultados[0]
  // Solo un precio en pesos uruguayos sirve como precio de compra.
  const conPrecio = resultados.find((r) => r.precio && (r.moneda ?? 'UYU') === 'UYU')
  const conPresentacion = resultados.find((r) => r.presentacion)
  const [nombre, setNombre] = useState(principal?.nombre ?? (pendiente ? `Pendiente de identificar (${codigo})` : ''))
  const [compra, setCompra] = useState<DatosCompra | null>(null)
  const [listo, setListo] = useState(false)
  const [id] = useState(nuevoId)

  // Si el precio viene de un supermercado que ya está en tus puntos de venta, se usa ese punto.
  const puntoWeb = conPrecio
    ? puntos.find((p) => p.nombre.toLowerCase().includes(conPrecio.fuenteNombre.toLowerCase()))
    : undefined

  const item: ItemCatalogo = {
    id,
    tipo: 'ingrediente',
    nombre: nombre.trim(),
    marca: principal?.marca,
    codigo,
    categoria: 'Sin categoría',
    presentacion: compra?.presentacion ?? { cantidad: 1, unidad: 'u' },
    merma: 0,
    usos: [],
    precios: compra?.precio ? [compra.precio] : [],
    puntoPreferidoId: compra?.precio?.puntoId,
    tono: '#EDE2CB',
    foto: principal?.imagen,
  }

  const otrosNombres = [...new Set(resultados.slice(1).map((r) => r.nombre))].filter((n) => n !== nombre)
  const aviso = pendiente
    ? 'Sin conexión: queda pendiente de identificar y se busca solo cuando vuelva internet.'
    : principal
      ? `Encontrado en ${[...new Set(resultados.map((r) => r.fuenteNombre))].join(', ')}. Revisá los datos.`
      : 'No está en Ta-Ta, El Dorado, Open Food Facts ni UPCitemdb. Cargalo a mano: queda en tu catálogo para la próxima.'

  if (listo && conReceta) {
    return (
      <>
        <ProductoFila item={item} insignia={<span className="rounded-md bg-aviso-fondo px-2 py-0.5 text-xs font-semibold text-aviso">Nuevo</span>} />
        <FormCantidad item={item} textoBoton={textoBoton} alConfirmar={(c, u) => alGuardar(item, compra?.puntoNuevo, c, u)} />
      </>
    )
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!item.nombre || !compra) return
        if (conReceta) setListo(true)
        else alGuardar(item, compra.puntoNuevo)
      }}
    >
      <p className={`m-0 rounded-xl px-3 py-2 text-[13px] font-medium ${pendiente ? 'bg-aviso-fondo text-aviso' : 'bg-tarjeta text-tinta-media'}`}>
        {aviso}
      </p>
      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-tinta-media">
        Nombre
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="h-[52px] rounded-[14px] border-[1.5px] border-borde-fuerte bg-tarjeta px-3.5 text-lg text-cacao outline-none focus:border-frutilla"
        />
      </label>
      {otrosNombres.length > 0 && (
        <div className="-mt-1 flex flex-wrap gap-1.5">
          {otrosNombres.slice(0, 3).map((n) => (
            <button type="button" key={n} onClick={() => setNombre(n)} className="rounded-full border border-borde-fuerte px-2.5 py-1 text-left text-[13px]">
              {n}
            </button>
          ))}
        </div>
      )}
      <CamposCompra
        inicial={{
          presentacion: conPresentacion?.presentacion,
          precio: conPrecio?.precio,
          puntoId: puntoWeb?.id,
          puntoNombre: conPrecio && !puntoWeb ? conPrecio.fuenteNombre : undefined,
        }}
        onCambio={setCompra}
      />
      {conPrecio && <p className="-mt-1 m-0 text-xs text-tinta-suave">Precio tomado de la web de {conPrecio.fuenteNombre}; corregilo si pagaste otro.</p>}
      <div className="flex gap-2.5">
        <button type="button" onClick={alCancelar} className="h-14 flex-1 rounded-2xl border-[1.5px] border-borde-fuerte font-semibold">
          Descartar
        </button>
        <button type="submit" disabled={!item.nombre || !compra} className="h-14 flex-[2] rounded-2xl bg-frutilla font-semibold text-tarjeta disabled:opacity-45">
          {conReceta ? 'Siguiente' : textoBoton}
        </button>
      </div>
    </form>
  )
}
