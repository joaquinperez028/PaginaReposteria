// Lectura de códigos de barras en vivo desde la cámara (DECISIONES.md P20).
// Plataforma principal: Chrome en Redmi/HyperOS, que trae el BarcodeDetector nativo (vía Google Play services).
// Si no está (ROM sin servicios de Google, otros navegadores), usa el ponyfill `barcode-detector`,
// que corre ZXing compilado a WebAssembly.
import { useEffect, useRef, useState } from 'react'

export type EstadoCamara =
  | 'iniciando'
  | 'activa'
  | 'sin-permiso'
  | 'sin-camara'
  | 'inseguro' // la página no es HTTPS ni localhost: Chrome no deja usar la cámara
  | 'sin-lector' // la cámara funciona pero no se pudo crear el lector de códigos
  | 'no-soportado'

const FORMATOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'] as const

interface Detector {
  detect(fuente: ImageBitmapSource): Promise<{ rawValue: string }[]>
}

interface ConstructorNativo {
  new (opciones: { formats: string[] }): Detector
  getSupportedFormats(): Promise<string[]>
}

let detectorPromesa: Promise<Detector> | undefined

/** Crea el detector una sola vez. */
export function obtenerDetector(): Promise<Detector> {
  detectorPromesa ??= (async () => {
    const Nativo = (globalThis as unknown as { BarcodeDetector?: ConstructorNativo }).BarcodeDetector
    if (Nativo) {
      try {
        const soportados = await Nativo.getSupportedFormats()
        const formatos = FORMATOS.filter((f) => soportados.includes(f))
        if (formatos.length > 0) return new Nativo({ formats: formatos })
      } catch {
        // seguimos con el respaldo
      }
    }
    const { BarcodeDetector } = await import('barcode-detector/ponyfill')
    return new BarcodeDetector({ formats: [...FORMATOS] }) as Detector
  })()
  return detectorPromesa
}

/** Último recurso: leer el código desde una foto o un archivo. */
export async function leerDeImagen(archivo: File): Promise<string | undefined> {
  const detector = await obtenerDetector()
  const imagen = await createImageBitmap(archivo)
  const resultado = await detector.detect(imagen)
  imagen.close()
  return resultado[0]?.rawValue
}

/** Vibración y un "bip" corto al detectar. */
export function avisarDeteccion() {
  navigator.vibrate?.(80)
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const vol = ctx.createGain()
    osc.frequency.value = 1320
    vol.gain.value = 0.08
    osc.connect(vol).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.09)
    osc.onended = () => void ctx.close()
  } catch {
    // sin audio, no pasa nada
  }
}

const REPETICION_MS = 2500

/**
 * Abre la cámara trasera y llama a `alDetectar` apenas un código entra en cuadro.
 * Mientras `pausado` es true no informa lecturas (ej. mientras se confirma un producto).
 * Un mismo código no se informa dos veces seguidas mientras siga a la vista.
 */
export function useLectorCodigos(alDetectar: (codigo: string) => void, pausado: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pistaRef = useRef<MediaStreamTrack | null>(null)
  const callback = useRef(alDetectar)
  const pausa = useRef(pausado)
  const ultimo = useRef({ codigo: '', t: 0 })
  const [estado, setEstado] = useState<EstadoCamara>('iniciando')
  const [linterna, setLinterna] = useState({ disponible: false, encendida: false })
  // Los Redmi tienen varias cámaras traseras (principal, gran angular, macro). Se puede elegir y se recuerda.
  const [camaraId, setCamaraId] = useState<string | undefined>(leerCamara)
  const [traseras, setTraseras] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    callback.current = alDetectar
    pausa.current = pausado
  })

  useEffect(() => {
    let cancelado = false
    let temporizador: number | undefined
    let stream: MediaStream | undefined

    void (async () => {
      if (!window.isSecureContext) {
        setEstado('inseguro')
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado('no-soportado')
        return
      }
      const resolucion = { width: { ideal: 1280 }, height: { ideal: 720 } }
      try {
        stream = await navigator.mediaDevices
          .getUserMedia({
            audio: false,
            video: camaraId ? { deviceId: { exact: camaraId }, ...resolucion } : { facingMode: { ideal: 'environment' }, ...resolucion },
          })
          .catch((e: DOMException) => {
            // La cámara guardada ya no existe: volvemos a la trasera por defecto.
            if (camaraId && e.name === 'OverconstrainedError') {
              guardarCamara(undefined)
              return navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, ...resolucion } })
            }
            throw e
          })
      } catch (e) {
        setEstado((e as DOMException).name === 'NotAllowedError' ? 'sin-permiso' : 'sin-camara')
        return
      }
      if (cancelado) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play().catch(() => undefined)

      const pista = stream.getVideoTracks()[0]
      pistaRef.current = pista
      const capacidades = (pista.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean; focusMode?: string[] }
      setLinterna({ disponible: Boolean(capacidades.torch), encendida: false })
      // Enfoque continuo: necesario para leer códigos de cerca en Android.
      if (capacidades.focusMode?.includes('continuous')) {
        await pista.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] }).catch(() => undefined)
      }
      // Con el permiso ya dado, los nombres de las cámaras están disponibles.
      const dispositivos = await navigator.mediaDevices.enumerateDevices().catch(() => [] as MediaDeviceInfo[])
      const videos = dispositivos.filter((d) => d.kind === 'videoinput')
      const atras = videos.filter((d) => /back|rear|trasera|environment/i.test(d.label))
      if (!cancelado) setTraseras(atras.length > 0 ? atras : videos)
      setEstado('activa')

      let detector: Detector
      try {
        detector = await obtenerDetector()
      } catch (e) {
        console.error('No se pudo crear el lector de códigos', e)
        setEstado('sin-lector')
        return
      }

      const ciclo = async () => {
        if (cancelado) return
        if (!pausa.current && video.readyState >= 2) {
          try {
            const codigo = (await detector.detect(video))[0]?.rawValue
            if (codigo) {
              const ahora = Date.now()
              const repetido = codigo === ultimo.current.codigo && ahora - ultimo.current.t < REPETICION_MS
              ultimo.current = { codigo, t: ahora }
              if (!repetido) callback.current(codigo)
            }
          } catch {
            // cuadro ilegible: seguimos
          }
        }
        temporizador = window.setTimeout(ciclo, 120)
      }
      void ciclo()
    })()

    return () => {
      cancelado = true
      if (temporizador) clearTimeout(temporizador)
      stream?.getTracks().forEach((t) => t.stop())
      pistaRef.current = null
    }
  }, [camaraId])

  /** Pasa a la siguiente cámara trasera. */
  function cambiarCamara() {
    if (traseras.length < 2) return
    const actual = pistaRef.current?.getSettings().deviceId ?? camaraId
    const i = traseras.findIndex((d) => d.deviceId === actual)
    const siguiente = traseras[(i + 1) % traseras.length].deviceId
    guardarCamara(siguiente)
    setEstado('iniciando')
    setCamaraId(siguiente)
  }

  async function alternarLinterna() {
    const pista = pistaRef.current
    if (!pista) return
    const encendida = !linterna.encendida
    try {
      await pista.applyConstraints({ advanced: [{ torch: encendida } as MediaTrackConstraintSet] })
      setLinterna({ disponible: true, encendida })
    } catch {
      setLinterna({ disponible: false, encendida: false })
    }
  }

  return { videoRef, estado, linterna, alternarLinterna, cambiarCamara, variasCamaras: traseras.length > 1 }
}

const CLAVE_CAMARA = 'camara-escaner'

function leerCamara(): string | undefined {
  try {
    return localStorage.getItem(CLAVE_CAMARA) ?? undefined
  } catch {
    return undefined
  }
}

function guardarCamara(id: string | undefined) {
  try {
    if (id) localStorage.setItem(CLAVE_CAMARA, id)
    else localStorage.removeItem(CLAVE_CAMARA)
  } catch {
    // sin almacenamiento: se usa la cámara por defecto
  }
}
