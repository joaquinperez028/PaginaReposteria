import { IconoBolsa, IconoEscanear, IconoReceta, IconoUbicacion } from './Iconos'

type Activa = 'recetas' | 'ingredientes' | 'puntos'

export function BarraInferior({ activa }: { activa: Activa }) {
  const item = (clave: Activa) =>
    `flex w-[72px] flex-col items-center gap-1 text-xs no-underline ${
      activa === clave ? 'font-semibold text-frutilla' : 'text-tinta-media'
    }`
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[84px] max-w-[480px] items-center justify-around border-t border-borde bg-tarjeta px-3 pb-[max(14px,env(safe-area-inset-bottom))]"
    >
      <a href="#/" className={item('recetas')} aria-current={activa === 'recetas' ? 'page' : undefined}>
        <IconoReceta tam={24} />
        Recetas
      </a>
      <a href="#/ingredientes" className={item('ingredientes')} aria-current={activa === 'ingredientes' ? 'page' : undefined}>
        <IconoBolsa tam={24} />
        Ingredientes
      </a>
      <a
        href="#/escanear"
        aria-label="Escanear código"
        className="-mt-[26px] flex size-16 items-center justify-center rounded-[22px] bg-frutilla text-tarjeta shadow-[0_6px_16px_rgba(110,24,48,0.3)]"
      >
        <IconoEscanear tam={28} />
      </a>
      <a href="#/puntos" className={item('puntos')} aria-current={activa === 'puntos' ? 'page' : undefined}>
        <IconoUbicacion tam={24} />
        Puntos
      </a>
    </nav>
  )
}
