# Pruebas

| Fecha | Comando | Resultado | Alcance |
|---|---|---|---|
| 2026-10-06 | `npm run typecheck` | OK | TypeScript estricto |
| 2026-10-06 | `npm run lint` | OK | ESLint 9 + reglas de React 19 y Next |
| 2026-10-07 | `npm run content:validate` | 0 errores, 0 avisos | 1.200 actividades (catálogo v2) |
| 2026-10-06 | `npm test` | 61/61 | Ver abajo |
| 2026-10-06 | `npm run build` | OK | Exportación estática + sw.js |
| 2026-10-06 | `npm run test:e2e` | 32/32 | Chromium móvil (Pixel 7) contra `npm run preview` |

## Unitarias e integración (Vitest)
- **Límites:** rojo individual y compartido, valores ausentes/desconocidos = rojo, contacto bloqueado por defecto, restricción por persona, amarillo con autorizados correctos, `requiereConfirmacion`, grupo valida a toda la sesión, asignaciones inválidas.
- **Motor:** 100 semillas × 200 oportunidades con 2 y 3 personas en catálogo sintético equiprobable: espera máxima ≤ 3 y diferencia de oportunidades ≤ 3; pares dirigidos dentro de ±15 % de la media; límites asimétricos sin atascos; cooldown ≥ 12; agotamiento sin bucle; ningún peso rehabilita; toda carta del catálogo real cumple sus límites; techo de progresión; determinismo con semilla.
- **Estado:** consentimiento inicial, amarillo sin reloj hasta autorizar, rechazo sin autoría ni insistencia, versión de límites caducada, edición de límites invalida carta/reloj/eventos, doble toque idempotente, reloj antiguo ignorado, pausa congela tiempo, detener, subir/bajar nivel.
- **Almacenamiento (fake-indexeddb):** sesión privada nunca se serializa, lista explícita, restauración en pausa y sin autorizaciones, invalidación por versión, datos dañados/desconocidos, bloqueo entre pestañas, pestaña antigua no reescribe tras borrar, favoritas solo IDs.
- **Catálogo:** metas 300/450/450 por familia, cobertura de cada juego por nivel y tamaño desde el primer tramo, variedad con la base segura.

## E2E (Playwright)
Sesión privada de 2 sin ninguna escritura en IndexedDB/Web Storage y sin alias en peticiones; recuperación de sesión normal de 3; subir con unanimidad / bajar inmediato; rechazo del consentimiento inicial sin señalar; los 12 juegos con 2 y 3 personas (votos con abstención, secretos con retiro y autoría opcional, reloj con pausa, cadena con salida, caos con sorpresas, noche completa); borrado con dos pestañas; segunda ventana y toma de control; offline tras primera carga con acceso directo a rutas; manifest, iconos y cabeceras; sin desplazamiento horizontal a 320/375/390/430 px; teclado y diálogos; ocultación al pasar a segundo plano; sin errores de consola.

## Pendientes manuales
- iPhone físico: instalación desde Safari y uso sin conexión (no disponible en este entorno).
- WebKit automatizado: no instalado aquí. La emulación no sustituye un iPhone real.
- Lector de pantalla real (VoiceOver/TalkBack): revisado por estructura (roles, etiquetas, `aria-live` por umbrales), no probado con tecnología asistiva.
