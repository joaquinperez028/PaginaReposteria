import { useState } from 'react'
import { analizarPrecio, precioPorMetodo, redondearVendible, type MetodoPrecio } from '../lib/costeo'
import { costo, pesos, porcentaje } from '../lib/formato'
import { HojaInferior } from './comunes'

type Tipo = MetodoPrecio['tipo']

const METODOS: { tipo: Tipo; nombre: string; ayuda: string; sufijo: string }[] = [
  { tipo: 'recargo', nombre: 'Recargo', ayuda: 'Le sumás un porcentaje al costo.', sufijo: '%' },
  { tipo: 'foodCost', nombre: 'Food cost', ayuda: 'Qué parte del precio querés que se vaya en costos.', sufijo: '%' },
  { tipo: 'multiplicador', nombre: 'Multiplicar', ayuda: 'Multiplicás el costo por un número.', sufijo: '×' },
  { tipo: 'manual', nombre: 'Precio a mano', ayuda: 'Escribís el precio y ves cuánto ganás.', sufijo: '$' },
]

export function PanelCalcular({
  costoPorcion,
  porciones,
  recargoRapido,
  inicial,
  alGuardar,
  alCerrar,
}: {
  costoPorcion: number
  porciones: number
  recargoRapido: number
  inicial?: MetodoPrecio
  alGuardar: (precio: number, metodo: MetodoPrecio) => void
  alCerrar: () => void
}) {
  const [tipo, setTipo] = useState<Tipo>(inicial?.tipo ?? 'recargo')
  const valorInicial = (t: Tipo): string => {
    if (inicial?.tipo === t) return String(t === 'recargo' || t === 'foodCost' ? Math.round(inicial.valor * 100) : inicial.valor)
    return { recargo: String(Math.round(recargoRapido * 100)), foodCost: '30', multiplicador: '3', manual: '' }[t]
  }
  const [textos, setTextos] = useState<Record<Tipo, string>>(() => ({
    recargo: valorInicial('recargo'),
    foodCost: valorInicial('foodCost'),
    multiplicador: valorInicial('multiplicador'),
    manual: valorInicial('manual'),
  }))
  const [redondear, setRedondear] = useState(true)

  const bruto = Number(textos[tipo].replace(',', '.'))
  const valor = tipo === 'recargo' || tipo === 'foodCost' ? bruto / 100 : bruto
  const valido = textos[tipo] !== '' && Number.isFinite(bruto) && bruto > 0 && !(tipo === 'foodCost' && bruto >= 100)
  const metodo = { tipo, valor } as MetodoPrecio
  const calculado = valido ? precioPorMetodo(costoPorcion, metodo) : 0
  const precio = tipo === 'manual' || !redondear ? calculado : redondearVendible(calculado)
  const analisis = analizarPrecio(precio, costoPorcion, porciones)
  const info = METODOS.find((m) => m.tipo === tipo)!

  return (
    <HojaInferior titulo="Calcular de otra manera" alCerrar={alCerrar}>
      <div role="tablist" aria-label="Método" className="grid grid-cols-2 gap-2">
        {METODOS.map((m) => (
          <button
            key={m.tipo}
            role="tab"
            aria-selected={tipo === m.tipo}
            onClick={() => setTipo(m.tipo)}
            className={`h-12 rounded-[14px] text-[15px] font-semibold ${
              tipo === m.tipo ? 'bg-cacao text-fondo' : 'border-[1.5px] border-borde-fuerte bg-tarjeta text-cacao'
            }`}
          >
            {m.nombre}
          </button>
        ))}
      </div>

      <p className="m-0 text-sm text-tinta-media">{info.ayuda}</p>

      <div className="flex items-center gap-2.5">
        <label className="flex flex-1 items-center gap-2 rounded-[14px] border-[1.5px] border-borde-fuerte bg-tarjeta px-3.5 focus-within:border-frutilla">
          <span className="solo-lector">Valor</span>
          {tipo === 'manual' && <span className="numeros text-xl text-tinta-suave">$</span>}
          <input
            inputMode="decimal"
            value={textos[tipo]}
            onChange={(e) => setTextos({ ...textos, [tipo]: e.target.value })}
            className="numeros h-[52px] w-full bg-transparent text-2xl font-medium text-cacao outline-none"
          />
          {tipo !== 'manual' && <span className="numeros text-xl text-tinta-suave">{info.sufijo}</span>}
        </label>
        {tipo === 'recargo' && (
          <button
            onClick={() => setTextos({ ...textos, recargo: String(Math.round(recargoRapido * 100)) })}
            className="h-[52px] rounded-[14px] border-[1.5px] border-dashed border-frutilla px-3 text-sm font-semibold text-frutilla"
          >
            +{Math.round(recargoRapido * 100)}% habitual
          </button>
        )}
      </div>

      {tipo !== 'manual' && (
        <label className="flex items-center gap-2.5 text-sm text-tinta-media">
          <input type="checkbox" checked={redondear} onChange={(e) => setRedondear(e.target.checked)} className="size-5 accent-frutilla" />
          Redondear a un precio vendible
        </label>
      )}

      <div className="numeros flex flex-col gap-3 rounded-[18px] border-2 border-dashed border-cacao bg-tarjeta p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-sans text-sm font-semibold text-tinta-media">Precio por porción</span>
          <span className="text-4xl font-medium">{valido ? pesos(precio) : '—'}</span>
        </div>
        {valido && tipo !== 'manual' && redondear && Math.abs(precio - calculado) > 0.005 && (
          <span className="-mt-2 self-end text-xs text-tinta-suave">calculado {costo(calculado)}</span>
        )}
        <div className="grid grid-cols-3 gap-2">
          <Dato titulo="Ganancia / porción" valor={valido ? costo(analisis.gananciaPorcion) : '—'} positivo={analisis.gananciaPorcion > 0} />
          <Dato titulo="Ganancia receta" valor={valido ? costo(analisis.gananciaReceta) : '—'} positivo={analisis.gananciaPorcion > 0} />
          <Dato titulo="Food cost" valor={valido ? porcentaje(analisis.foodCost) : '—'} />
        </div>
        {valido && tipo === 'recargo' && (
          <p className="m-0 font-sans text-[13px] leading-snug text-tinta-media">
            Ojo: +{Math.round(valor * 100)}% sobre el costo no es ganar {Math.round(valor * 100)}%. Con este precio,
            el costo es el <strong>{porcentaje(analisis.foodCost, 0)}</strong> de lo que cobrás.
          </p>
        )}
        {valido && analisis.gananciaPorcion <= 0 && (
          <p className="m-0 font-sans text-[13px] font-semibold text-frutilla">Con este precio perdés plata.</p>
        )}
      </div>

      <button
        disabled={!valido}
        onClick={() => alGuardar(precio, metodo)}
        className="h-14 rounded-2xl bg-frutilla text-base font-semibold text-tarjeta disabled:opacity-45"
      >
        Guardar como precio de venta
      </button>
    </HojaInferior>
  )
}

function Dato({ titulo, valor, positivo }: { titulo: string; valor: string; positivo?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 rounded-xl p-2.5 ${positivo ? 'bg-pistacho-claro' : 'bg-fondo'}`}>
      <span className={`font-sans text-xs ${positivo ? 'text-pistacho' : 'text-tinta-suave'}`}>{titulo}</span>
      <span className={`text-base font-medium ${positivo ? 'text-pistacho-osc' : ''}`}>{valor}</span>
    </div>
  )
}
