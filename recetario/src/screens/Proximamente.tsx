import { BarraInferior } from '../components/BarraInferior'

export function Proximamente({ titulo }: { titulo: string }) {
  return (
    <div className="flex min-h-dvh flex-col gap-3 px-5 pb-28 pt-6">
      <a href="#/" className="font-semibold text-frutilla">‹ Recetas</a>
      <h1 className="m-0 font-display text-4xl font-semibold">{titulo}</h1>
      <p className="m-0 text-tinta-media">Esta pantalla sigue los mismos patrones y llega en el próximo paso.</p>
      <BarraInferior activa={titulo === 'Puntos de venta' ? 'puntos' : 'recetas'} />
    </div>
  )
}
