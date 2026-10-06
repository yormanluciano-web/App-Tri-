# Mapa del proyecto

## Rutas (exportación estática, `trailingSlash`)
| Ruta | Pantalla | Archivo |
|---|---|---|
| `/` | Inicio, continuar/descartar sesión guardada, aviso local, estado offline, instalar | `src/features/session/Home.tsx` |
| `/crear/` | Asistente: almacenamiento → personas → alias/18+ → relación → límites individuales (entrega del teléfono) → compartidos → intensidad → duración → juegos → resumen → consentimiento | `src/features/setup/SetupWizard.tsx` |
| `/jugar/` | Mesa: lanzadores, rondas por juego, autorizaciones, pausa, detener, niveles, bloqueos, cierre | `src/features/session/Table.tsx` |
| `/favoritas/` | IDs de cartas guardadas | `src/features/session/Favorites.tsx` |
| `/ajustes/` | Accesibilidad, privacidad, borrado, versión | `src/features/privacy/Settings.tsx` |
| `/ayuda/` | Cómo funciona, aviso adultos | `src/features/session/Help.tsx` |

Los pasos del asistente y las fases de cada juego son estados de interfaz; nunca hay datos personales en la URL.

## Dominio (funciones puras)
| Módulo | Responsabilidad |
|---|---|
| `domain/models/constants.ts` | Taxonomía de permisos, categorías, juegos, formatos, efectos, textos de UI centrales (nombre TRIO) |
| `domain/models/activity.ts` | Esquema Zod de Activity y ContentPack |
| `domain/models/session.ts` | Tipos de Participant, LimitProfile, SessionState, Turn |
| `domain/consent/limits.ts` | Semáforo, combinación individual/compartido/por pareja, `evaluateAssignment` |
| `domain/engine/select.ts` | Filtros obligatorios, asignaciones, equilibrio (espera ≤ 3), ponderación, cooldown |
| `domain/engine/progression.ts` | Tramos bajo/medio/alto por turnos y tiempo activo |
| `domain/engine/orchestrator.ts` | Ronda: juego (rotación, Noche, Caos), sorpresas, cadena, repetición voluntaria |
| `domain/state/session.ts` | Transiciones idempotentes con versiones: consentimiento, cerrar, cambiar, pausa, detener, niveles, límites, reloj |
| `domain/content/validate.ts` | Validador y reporte del catálogo; familias editoriales |
| `domain/content/repository.ts` | Contratos de lectura/escritura del catálogo para un panel futuro |

## UI y coordinación
- `stores/session.ts`: Zustand; aplica transiciones, persiste (solo sesión normal), bloqueo de escritor, avisos entre pestañas.
- `features/session/PrivateRound.tsx`: entrega del teléfono y respuestas privadas en memoria.
- `features/games/rounds.tsx` y `common.tsx`: controladores de juego, carta, acciones, temporizador.

## Almacenamiento
- `storage/serialize.ts`: lista explícita de campos y restauración en punto seguro.
- `storage/repository.ts`: `IndexedDbSessionRepository`, `MemorySessionRepository`, favoritas.
- `storage/coordination.ts`: BroadcastChannel, bloqueo con expiración, borrado total.
- `storage/settings.ts`: ajustes no sensibles en localStorage.

## Contenido
`src/data/{leve,picante,perverso}/` con `base.ts` y `extra-NN.ts` (formato compacto `defineCards` en `src/data/define.ts`). `src/data/catalog.ts` compone y filtra producción. Añadir cartas: nuevo archivo en el nivel + registrarlo en su `index.ts` + `npm run content:validate`.

## PWA
`public/manifest.json`, `public/icons/*` (SVG originales y PNG generados con `npm run icons`), `scripts/sw-template.js` → `out/sw.js` (`scripts/build-sw.mjs`), `src/pwa/register.ts` (registro solo en producción, verificación offline, actualización a petición), `src/pwa/install.ts`.

## Dependencias de ejecución
next 16.4.0, react 19.3.0, zod 4, zustand 5. Desarrollo: typescript 5.9, tailwindcss 4.3, vitest 3.2, @playwright/test 1.56.1, fake-indexeddb, tsx, eslint 9.
