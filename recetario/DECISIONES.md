# DECISIONES.md — App de recetas con escáner y costeo

> Resultado del grilling del 03/11/2026. Fuente original: `Detalles.md`.
> Cada decisión indica el número de pregunta en que se tomó (P#).

## 0. Principio rector

**Costo cero.** Proyecto de prueba sin presupuesto. Toda decisión se evalúa contra esto. Ningún servicio se configura con tarjeta de crédito; si se alcanza un límite gratuito, el servicio se pausa en lugar de cobrar. (P17)

## 1. Qué es

Web app para celular que escanea códigos de barras con la cámara, identifica productos y permite armar **recetas** con costeo completo para decidir el precio de venta por porción.

- Uso **personal**, sin fines comerciales, etapa de **prueba de ideas**. (P5)
- **Plataforma objetivo: Redmi con HyperOS, usando Chrome.** iPhone queda fuera del alcance por ahora. (P23)
- **1 usuario al inicio, máximo 2**, en un espacio compartido. (P3, P14, P16)
- Idioma: español. Moneda: **pesos uruguayos (UYU)**. Unidades: **sistema métrico** (g, kg, ml, l, unidades). (P17)

## 2. Stack técnico

| Pieza | Elección | Por qué |
|---|---|---|
| Frontend | **Vite + React + TypeScript + Tailwind** | Simple y liviano; todo pasa en el celular. (P6) |
| App | **PWA instalable** (ícono en pantalla de inicio, pantalla completa) | Sin tiendas de apps. (P16) |
| Base local | **RxDB** (núcleo open source, almacenamiento gratuito basado en Dexie) | Funciona 100% offline. Sin plugins premium. (P17) |
| Servidor | **Supabase** (plan gratis: Postgres, Auth, Storage) | Copia central, fotos y login propio. Datos relacionales en Postgres estándar y portable. (P4, P17, P21) |
| Sincronización | **Plugin oficial RxDB ↔ Supabase** (`rxdb/plugins/replication-supabase`, en beta) | Sincronización bidireccional ya resuelta; no hay que programarla a mano. (P21) |
| Hosting | **Vercel Hobby** (gratis) | Válido por ser uso no comercial. Si pasa a comercial: Vercel Pro o Cloudflare Pages. (P5) |
| Identificación de productos | **Cascada de fuentes gratis, en paralelo**, vía la función `/api/producto` (Vercel; en desarrollo la atiende Vite): catálogo propio → **El Dorado** (UY) → **Open Food Facts** y sus bases hermanas (productos en general, cosmética, mascotas) → **Cosmos** (Brasil, token gratis opcional en `COSMOS_TOKEN`) → **Carrefour, Jumbo, Disco, Vea y Día Argentina** → **UPCitemdb** (internacional, 100 consultas/día). `?diagnostico=1` muestra el estado de cada fuente. | Open Food Facts solo no alcanza. Mucho de lo que se vende en Uruguay viene de Argentina y Brasil. Probadas y descartadas (03/11/2026): Ta-Ta, Devoto, Disco y Géant UY ya no tienen catálogo público; Carrefour Brasil bloquea consultas. Los precios en otra moneda no se usan como precio de compra. (P1, P25, P26) |
| Precios de referencia | **SIPC** (precios.gub.uy) | Precios oficiales por cadena en Uruguay. (P11) |
| Escáner | **Lectura en vivo desde el video**: `BarcodeDetector` nativo de Chrome + **zxing-wasm** como respaldo (gratuito). Formatos EAN-13, EAN-8 y UPC | Lee sin sacar foto en Redmi/HyperOS. (P17, P20, P23) |

Descartados: Convex (elegido primero, pero sin modo offline; obligaba a programar la sincronización a mano — reemplazado en P21), Firebase (fotos requieren plan pago desde feb/2026), Appwrite (consultas relacionales limitadas), InstantDB (sincronización solo alojada y login ajeno), login con Google (se exige login propio).

### Compatibilidad HyperOS (P23)
- Se diseña y prueba para **Chrome en Android/HyperOS** (pantallas de ~393 px de ancho).
- El escáner usa el **BarcodeDetector nativo de Chrome**; ZXing (WASM) queda como respaldo para teléfonos sin servicios de Google o navegadores sin soporte.
- Si la app se abre en el **navegador de Xiaomi (Mi Browser)**, se muestra un aviso para abrirla en Chrome: Mi Browser no permite instalarla y su cámara web es poco confiable.
- En Chrome se ofrece un botón **"Instalar"** (ícono en el inicio, pantalla completa, funciona sin conexión). Íconos PNG 192/512 + maskable.
- Cámara: **enfoque continuo** y botón para **cambiar de cámara trasera** (los Redmi tienen principal, gran angular y macro); la elegida se recuerda.
- Se pide **almacenamiento persistente** para que el sistema no borre los datos guardados en el teléfono.
- Pendiente para la sincronización: HyperOS cierra agresivamente las apps en segundo plano, así que la sincronización debe correr al abrir la app y al volver a ella, no depender de tareas en segundo plano.

## 3. Offline (P16, P17)

- **Offline completo**: todo se escribe primero en el teléfono y se sincroniza en segundo plano.
- Conflictos: **gana el último cambio** (suficiente con 1–2 usuarios).
- **Cola de pendientes** para lo que requiere internet, que se resuelve sola al reconectar:
  - Búsqueda en Open Food Facts → el producto queda "pendiente de identificar" y se puede seguir cargando la receta.
  - Consulta de precios del SIPC.
  - Subida de fotos (mientras tanto se guardan en el teléfono).
- **Pausa por inactividad de Supabase** (plan gratis, tras 7 días con poca actividad; restaurable hasta 90 días): la app sigue funcionando en el teléfono y solo deja de sincronizar. Se muestra un aviso de "sincronización pausada" con instrucciones para reactivar el proyecto desde el panel de Supabase. (P21)

## 4. Usuarios y acceso (P14, P15)

- **Espacio compartido**: todos ven y editan todo.
- **Login propio** con usuario y contraseña, usando Supabase Auth en nuestro propio proyecto. **Registro público desactivado**, sin confirmación por email, sin Google. Las acciones del administrador (invitar, restablecer) se ejecutan en una función del servidor de Supabase. (P21)
- **Alta por invitación**: el administrador genera un código de invitación y lo pasa por fuera (ej. WhatsApp).
- **Contraseña olvidada**: el administrador genera un código de restablecimiento.
- Único rol especial: **administrador del espacio** (invitar, restablecer contraseñas, quitar miembros).
- Cada registro guarda **quién lo creó y quién lo modificó por última vez**.

## 5. Modelo de datos

### Proyecto (P2)
- Campo **tipo**. v1 solo `receta`. Futuro: `evento/pedido`, `inventario`.

### Catálogo (datos fijos, reutilizables en todas las recetas) (P2, P8, P9)
Contiene **ingredientes** e **insumos** (consumibles y envases: bandejas, film, papel manteca, bolsas), con la misma estructura:
- Código de barras (opcional: verduras sueltas no tienen)
- Nombre, marca
- Categoría (lista definida por el usuario)
- Tipo: ingrediente | insumo
- Foto (cámara o archivo, comprimida a ~150–250 KB)
- Usos (etiquetas)
- Tiempo de cocción por defecto
- **Merma por defecto (%)**
- **Presentación de compra**: cantidad + unidad, incluidas las chicas (500 g, 900 ml, 1 kg, maple de 30 u). (P24)
- Precio de referencia SIPC (cuando exista)

### Puntos de venta (tabla propia, reutilizable) (P8)
- Nombre, link de Google Maps, notas.
- Relación con el catálogo: **precio pagado por la presentación en ese punto de venta + fecha** (cada punto puede vender otro tamaño: 1 kg en la feria, 500 g en el súper). La app lo convierte a precio por kg, litro o unidad para costear y comparar. (P24)
- El ingrediente muestra dónde está más barato y si un precio está desactualizado.

### Equipos (P9)
- Nombre (ej. "Horno a gas", "Freidora de aire"), tipo de energía, **costo por hora**.
- La app ayuda a calcular el costo por hora a partir de la potencia y la tarifa.

### Receta (P13)
- Nombre, foto del plato terminado, categoría (dulce, salado, panificado...)
- **Rendimiento**: peso/volumen total + tamaño de porción → porciones calculadas; o cantidad de unidades.
- **Pasos** ordenados, cada uno con tiempo y equipo usado (de acá sale el costo de energía).
- Tiempo total (suma de pasos), notas.
- **Estado**: idea → probada → lista para vender.
- **Precio de venta elegido** y método usado.

### Ingrediente/insumo dentro de una receta (P8, P9)
- Cantidad + unidad (aprovechable)
- Merma específica (si difiere de la del catálogo)
- Tiempo de cocción específico (si difiere)
- Punto de venta / precio usado para el costeo
- Notas ("picado fino")
- Costo calculado

## 6. Costeo (P8–P12)

**Por ingrediente:**
```
precio por unidad base        = precio pagado ÷ presentación en kg, l o u   ($99 por 900 ml → $110/l)
costo por unidad aprovechable = precio de compra ÷ (1 − merma)
costo en la receta            = cantidad aprovechable × costo por unidad aprovechable
```
Ejemplo: 1 kg de zanahoria a $60 con 20% de merma → $75/kg aprovechable → 300 g = $22,50.

**Por receta:**
```
costo total      = Σ ingredientes (con merma) + Σ insumos/envases + Σ energía (minutos × costo/hora del equipo)
costo por porción = costo total ÷ porciones
```
Mano de obra: **fuera de la v1**.

**Precio de venta (P10, P12):**
- Se muestra el **precio sugerido con food cost 30%** (`precio = costo por porción ÷ 0,30`) con un **ícono ⓘ** que explica qué es el food cost.
- Botón **"Calcular de otra manera"** que permite:
  - Elegir un porcentaje propio con cualquier método: recargo sobre costo (opción rápida: **+70%**, costumbre local), food cost objetivo o multiplicador.
  - Escribir directamente un precio de venta y ver ganancia por porción, ganancia por receta y food cost resultante.
- El precio elegido se guarda como precio de venta; el sugerido sigue visible como referencia.
- Redondeo a número vendible. IVA opcional, apagado por defecto.
- Todos los porcentajes por defecto son editables en configuración.

> Nota: recargo sobre costo ≠ margen. Costo $100 + 70% = $170 (costo = 59% del precio). Food cost 30% = $333. La app debe dejar esta diferencia clara.

## 7. Flujos principales (P7)

**Agregar ingrediente a una receta** (flujo principal):
1. Dentro de la receta → "Agregar ingrediente".
2. Dos caminos: **buscar en el catálogo** (autocompletado) o **escanear**.
3. Al escanear, el código se busca en orden: **catálogo propio → Open Food Facts → carga manual**.
4. **Modo ráfaga**: tras confirmar, la cámara queda abierta para el siguiente.

**Cómo funciona el escáner** (P20):
- La cámara trasera se abre en vivo y el código se lee **apenas entra en cuadro, sin sacar foto ni tocar botones**.
- Guía visual en pantalla (recuadro donde apuntar), **vibración y sonido** al detectar, y botón de **linterna** para lugares con poca luz.
- Al detectar, se evita leer dos veces el mismo código seguido (importante en modo ráfaga).
- El lector (incluido el archivo WASM de ~2 MB) va **empaquetado en la app** para funcionar offline.
- Respaldos, en este orden, si la lectura en vivo no es posible: **escribir el código a mano** y, como último recurso, leerlo desde una foto o un archivo.
- Requiere HTTPS (lo da Vercel) y permiso de cámara; si el permiso se niega, se explica cómo habilitarlo.

**Escaneo general** (secundario): botón en el inicio para identificar un producto y agregarlo a una receta o solo al catálogo.

**Pantalla Ingredientes**: tabla completa del catálogo para ver, editar, borrar y ver en qué recetas se usa cada uno.

**Configuración**: porcentajes por defecto, equipos, categorías, miembros (admin), **uso de cada límite gratuito** (Supabase) y **estado de la sincronización** (al día / pendientes / pausada).

## 8. Diseño (P18, P19)

- No hay diseño previo. Se diseñan primero las **4 pantallas núcleo** para revisión antes de programar:
  1. Lista de recetas
  2. Detalle de receta con costeo
  3. Escáner
  4. Ficha de ingrediente
- Lo demás (puntos de venta, equipos, configuración) sigue los mismos patrones.
- Dirección visual: **mezcla de "cuaderno de cocina" y "herramienta profesional"**.
  - Superficie cálida y precisión donde importa: costos, food cost y precios en números grandes, tabulares y claros.
- Uso en cocina: **botones grandes, alto contraste, uso con una mano**.
- **Modo claro por defecto**, oscuro automático según el teléfono.

### Identidad visual (P22) — reemplaza la paleta tierra inicial, que resultó genérica
- **Colores de repostería**:
  - Frutilla/bordó `#9B2342` — acciones principales y anotaciones (hover `#6E1830`).
  - Dulce de leche `#D9902F` / `#E8B36A` — acentos cálidos, fotos, barra de costos.
  - Manteca `#F6C25B` — guía del escáner sobre fondo oscuro.
  - Pistacho `#3B5A1C` sobre `#E1EBD0` — ganancias, "probada", "en tu catálogo".
  - Cacao `#2B1712` — tinta. Fondo `#F6EEE3`, tarjetas `#FFFBF5`.
  - Ámbar `#6E4700` sobre `#F3E3BF` — solo avisos (sin conexión, precio desactualizado).
- **Tipografía en tres voces**:
  - **Bricolage Grotesque** — títulos y nombres de recetas.
  - **Figtree** — texto general.
  - **DM Mono** — todos los precios y costos (estética de ticket de almacén).
  - **Caveat** — anotaciones manuscritas puntuales, como en un cuaderno ("¡actualizar!").
- Tarjeta del precio sugerido con **borde punteado**, como un ticket recortado.
- Diseño de referencia: lienzo "Pantallas núcleo — App de recetas" (4 pantallas, 390 px de ancho).

## 9. Mejoras futuras (fuera de la v1)

- Proyectos de tipo **evento/pedido** e **inventario**. (P2)
- **Registro de ventas y experiencias** por receta: fecha, unidades vendidas, precio, comentarios. (P13)
- **Mano de obra** en el costeo (horas × valor hora). (P9)

## 10. Verificaciones pendientes antes de construir

1. **SIPC**: confirmar que los datos de precios.gub.uy se puedan obtener de forma automática y estable, y cómo se cruzan con nuestros productos (código de barras o nombre). Si no es viable, la carga manual por punto de venta queda como respaldo sin frenar el resto. (P11)
2. **Sincronización RxDB ↔ Supabase**: validar con un prototipo mínimo el plugin (está en beta), la regla "gana el último cambio", las tablas con los campos que exige (clave primaria de texto, `_modified`, `_deleted`) y las fotos en cola.
3. **Límites gratuitos**: confirmar los límites vigentes de Supabase y Vercel al momento de empezar.
4. **WASM del escáner**: el respaldo ZXing se descarga la primera vez y el service worker lo guarda para usarlo sin conexión. Como en HyperOS con Chrome se usa el lector nativo, alcanza; empaquetarlo dentro de la app queda como mejora.
5. **Probar en un Redmi real**: lectura en vivo, linterna, cambio de cámara e instalación desde Chrome.

## 11. Próximos pasos (flujo de trabajo)

1. ~~/grill-me → DECISIONES.md~~ ✅
2. /teach-impeccable (no instalado en esta sesión; se aplican sus criterios o se instala antes).
3. ~~Diseñar las 4 pantallas núcleo (reemplaza el paso del link de Figma).~~ ✅
4. ~~Levantar servidor (`npm run dev`).~~ ✅ Proyecto `recetario/` con las 4 pantallas y datos de ejemplo en memoria.
5. ~~Playwright: abrir, capturar, comparar con el diseño y corregir (3 rondas).~~ ✅
5b. Conectar RxDB (offline) + replicación con Supabase y login por invitación.
6. Revisar animaciones con criterio emil-design-eng (no instalado en esta sesión).
7. /ponytail-review para borrar código que sobra (no instalado en esta sesión).
