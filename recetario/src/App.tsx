import { useEffect, useState } from 'react'
import { ProveedorDatos } from './data/almacen'
import { ListaRecetas } from './screens/ListaRecetas'
import { DetalleReceta } from './screens/DetalleReceta'
import { Escaner } from './screens/Escaner'
import { FichaIngrediente } from './screens/FichaIngrediente'
import { ListaIngredientes } from './screens/ListaIngredientes'
import { Proximamente } from './screens/Proximamente'

/** Rutas con hash (#/receta/torta): funcionan sin servidor y sin conexión. */
function useRuta() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const cambio = () => {
      setHash(window.location.hash)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', cambio)
    return () => window.removeEventListener('hashchange', cambio)
  }, [])
  const [camino, consulta = ''] = hash.replace(/^#/, '').split('?')
  return { partes: camino.split('/').filter(Boolean), params: new URLSearchParams(consulta) }
}

function Pantalla() {
  const { partes, params } = useRuta()
  const [seccion, id] = partes
  switch (seccion) {
    case 'receta':
      return <DetalleReceta id={id} />
    case 'escanear':
      return <Escaner recetaId={params.get('receta') ?? undefined} demo={params.get('demo') ?? undefined} />
    case 'ingrediente':
      return <FichaIngrediente id={id} />
    case 'ingredientes':
      return <ListaIngredientes />
    case 'puntos':
      return <Proximamente titulo="Puntos de venta" />
    case 'ajustes':
      return <Proximamente titulo="Configuración" />
    default:
      return <ListaRecetas />
  }
}

export function App() {
  return (
    <ProveedorDatos>
      <div className="mx-auto min-h-dvh max-w-[480px] bg-fondo text-cacao">
        <Pantalla />
      </div>
    </ProveedorDatos>
  )
}
