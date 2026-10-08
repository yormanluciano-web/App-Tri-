# Cómplice (antes TRIO) — instrucciones del proyecto

@AGENTS.md

PWA de juegos privados para 2 o 3 adultos que comparten un teléfono. Especificación completa: `docs/PLAN_MAESTRO.md`.

## Lectura inicial al retomar
1. `docs/ESTADO.md` (fase, último resultado verificado, siguiente acción)
2. `docs/PENDIENTES.md` y `docs/DECISIONES.md`
3. `git status` y `git log --oneline -10`

## Comandos reales
| Comando | Qué hace |
|---|---|
| `npm ci` | Instala con lockfile (Node 22, ver `.nvmrc`) |
| `npm run dev` | Desarrollo (sin service worker) |
| `npm run build` | Valida catálogo → `next build` (exportación estática a `out/`) → genera `out/sw.js` |
| `npm run preview` | Sirve `out/` en http://localhost:4173 (build de producción) |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm run test` | Vitest (motor, consentimiento, estado, almacenamiento, catálogo) |
| `npm run test:e2e` | Playwright contra `npm run preview` (requiere build previo) |
| `npm run content:validate` / `content:report` | Validador y recuento del catálogo |

## Invariantes de consentimiento (no negociables)
- Rojo nunca llega a pantalla. Valor ausente o desconocido = rojo. Orden `red > yellow > green`.
- Amarillo («Preguntar antes») o `requiereConfirmacion` → respuestas privadas de cada persona afectada; solo unanimidad autoriza; nunca mostrar quién ni cuántos rechazaron. Por decisión de la propietaria, lo aceptado en verde al inicio no se vuelve a preguntar en cada carta (el catálogo no usa `requiereConfirmacion`).
- Una autorización vale para un turno, actividad, asignación y versión de límites. Editar límites invalida carta, cola, cadena, reloj y autorizaciones.
- Subir de nivel requiere unanimidad privada; bajar es inmediato. Nunca hay ascenso automático.
- Ningún peso, favorito, sorpresa, dado, ruleta o cadena rehabilita una opción descartada: todo pasa por `selectCandidate` / `evaluateAssignment`.
- Respuestas, votos y autorías viven solo en memoria de la ronda (`RoundEphemeral`), nunca en `SessionState` persistible.
- Sesión privada: cero escrituras en IndexedDB/Web Storage. Serializar solo con la lista explícita de `src/storage/serialize.ts`.
- Nada de datos de juego en URL, logs, red o telemetría. Sin IA online, analítica ni SDKs externos. La única llamada de red es el panel de administración (`src/admin/`), que solo envía `src/data/custom/cartas.json` a la API de GitHub; la llave nunca se guarda en el dispositivo.

## Arquitectura
- `src/domain/` funciones puras (reloj y RNG inyectables): `engine/` selección, progresión, orquestador; `consent/limits.ts`; `state/session.ts` transiciones; `content/validate.ts`.
- `src/data/` catálogo estático por nivel (`defineCards`). Añadir cartas no requiere tocar el motor.
- `src/stores/` Zustand coordina UI; `src/storage/` repositorios IndexedDB/memoria; `src/features/` pantallas; `src/pwa/` registro del worker.

Nunca registres alias, límites o respuestas reales en documentos, commits o logs.
