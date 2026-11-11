import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { tam?: number }

function Base({ tam = 22, children, strokeWidth = 1.9, ...rest }: P) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconoAtras = (p: P) => <Base strokeWidth={2.2} {...p}><path d="M15 5l-7 7 7 7" /></Base>
export const IconoCerrar = (p: P) => <Base strokeWidth={2.2} {...p}><path d="M6 6l12 12M18 6L6 18" /></Base>
export const IconoBuscar = (p: P) => <Base strokeWidth={2} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Base>
export const IconoMas = (p: P) => <Base strokeWidth={2.2} {...p}><path d="M12 5v14M5 12h14" /></Base>
export const IconoEscanear = (p: P) => (
  <Base strokeWidth={2} {...p}><path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3M8 9v6M11 9v6M14 9v6M17 9v6" /></Base>
)
export const IconoReceta = (p: P) => <Base {...p}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M9 9h6M9 13h4" /></Base>
export const IconoBolsa = (p: P) => <Base {...p}><path d="M6 8h12l-1 12H7z" /><path d="M9 8a3 3 0 0 1 6 0" /></Base>
export const IconoUbicacion = (p: P) => <Base {...p}><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></Base>
export const IconoAjustes = (p: P) => (
  <Base {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></Base>
)
export const IconoEditar = (p: P) => <Base {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /></Base>
export const IconoCamara = (p: P) => <Base {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Base>
export const IconoLinterna = (p: P) => <Base {...p}><path d="M7 3h10l-2 6H9z" /><path d="M9 9v12h6V9" /><path d="M12 13v3" /></Base>
export const IconoCheck = (p: P) => <Base strokeWidth={2.4} {...p}><path d="M5 12l5 5L19 7" /></Base>
export const IconoCambiarCamara = (p: P) => (
  <Base {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><path d="M9.5 12.5a2.5 2.5 0 0 1 4.3-1.7M14.5 13.5a2.5 2.5 0 0 1-4.3 1.7" /><path d="M14 9.5v1.6h-1.6M10 16.5v-1.6h1.6" /></Base>
)
export const IconoTeclado = (p: P) => <Base {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" /></Base>
