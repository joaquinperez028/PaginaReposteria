# Recetario
El código está en `recetario/`: corré los comandos desde ahí.
Las decisiones de producto y stack están en `recetario/DECISIONES.md`: leelo antes de cambiar producto, stack o datos.

## Comandos (desde recetario/)
- Tests: `npm test` · un archivo: `npx vitest run src/lib/costeo.test.ts`
- Tipos: `npx tsc --noEmit`
- Probar la cámara en el celular: `npm run dev:https` (la cámara exige HTTPS)

## Reglas
- Costo cero: ningún servicio pago ni que pida tarjeta.
- Objetivo: Chrome en Android/HyperOS, ~393 px de ancho. iPhone fuera de alcance.
- Textos en español, moneda UYU, sistema métrico.
