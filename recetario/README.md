# Recetario

Web app para celular: escaneá códigos de barras, armá recetas y calculá el precio de venta por porción.
Las decisiones de producto y técnicas están en `DECISIONES.md`.

## Cómo arrancar

Necesitás Node.js 20 o superior.

```bash
npm install
npm run dev
```

Vite muestra dos direcciones: `Local` (para la compu) y `Network` (para abrir desde el celular en la misma red Wi-Fi).

> **Teléfono objetivo: Redmi con HyperOS, usando Chrome** (no el navegador de Xiaomi, que no permite instalar la app).
> La cámara solo funciona con HTTPS o en `localhost`. Para probar el escáner en el Redmi (mismo Wi-Fi que la compu):
> `npm run dev:https` y abrí en Chrome del teléfono la dirección `https://192.168...:5173` que muestra Vite.
> Chrome avisa que la conexión no es privada (el certificado es local): Configuración avanzada › Acceder igual.
> Para probar sin cámara: `#/escanear?receta=torta-zanahoria&demo=7730205033047`.

Otros comandos:

```bash
npm test         # tests del costeo (vitest)
npm run build    # chequeo de tipos + build de producción en dist/
npm run preview  # sirve el build
```

## Qué hay en esta versión

- Las 4 pantallas núcleo del diseño: lista de recetas, detalle con costeo, escáner en vivo y ficha de ingrediente.
- Costeo completo: merma, insumos, energía por equipo, food cost, recargo, multiplicador y precio a mano.
- Escáner en vivo: `BarcodeDetector` nativo de Chrome en Android; si no está, `barcode-detector` (ZXing en WebAssembly).
  Recuadro guía, vibración y bip, linterna, enfoque continuo, cambio de cámara trasera (los Redmi tienen varias),
  modo ráfaga, carga manual del código y lectura desde foto.
  Busca primero en el catálogo propio y después, en paralelo, en Ta-Ta, El Dorado, Open Food Facts y UPCitemdb
  (función `api/producto.ts`; en `npm run dev` la atiende Vite). Sin conexión queda "pendiente de identificar".
- Presentaciones de compra con unidades chicas (500 g, 900 ml, maple de 30 u): se carga cuánto compraste, cuánto
  pagaste y dónde, y la app calcula el precio por kg, litro o unidad. "Actualizar precio" en la ficha del ingrediente.
- PWA instalable desde Chrome (botón "Instalar" en la app; aviso si se abre en el navegador de Xiaomi). Fuentes empaquetadas, almacenamiento persistente y modo oscuro automático.
- iPhone: fuera del alcance por ahora.
- Datos de ejemplo en memoria (`src/data/ejemplo.ts`): se reinician al recargar.

## Próximo paso

Reemplazar el estado en memoria (`src/data/almacen.tsx`) por RxDB y conectar la replicación con Supabase
(login propio por invitación incluido).

## Estructura

```
src/
  lib/costeo.ts        fórmulas puras (+ costeo.test.ts)
  lib/receta.ts        costo de una receta a partir del catálogo y los equipos
  lib/formato.ts       pesos uruguayos, porcentajes, duraciones
  data/                datos de ejemplo y estado de la app
  escaner/             lector en vivo y búsqueda en Open Food Facts
  screens/             pantallas
  components/          piezas compartidas
```
