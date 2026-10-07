# Decisiones y desviaciones

| Fecha | Decisión | Motivo | Consecuencia / verificación |
|---|---|---|---|
| 2026-10-06 | Se usa el repositorio existente `App-Tri-` en lugar de crear `trio-pwa` | El repositorio estaba vacío y destinado a este trabajo | Rama de trabajo `claude/hola-mwq2zq` |
| 2026-10-06 | Next.js 16.4 con `output: "export"` y `trailingSlash` | Toda la lógica es cliente; permite precachear `out/` completo y servir rutas profundas offline | `preview` sirve `out/` con un servidor estático propio; sin Server Actions ni endpoints |
| 2026-10-06 | Vitest 3.2 en lugar de 4.1 | npm 10.9 falla al resolver el árbol de vitest 4.1 (`edgesOut` null) | Sin impacto funcional |
| 2026-10-06 | Campo extra `formato` en Activity (`pregunta`, `reto`, `votacion`, `conocimiento`, `secreto`, `sorpresa`) | Los juegos necesitan mecánicas distintas sin leer el texto | Validado por esquema y por compatibilidad juego↔formato |
| 2026-10-06 | Permiso extra `adivinanzas` en la taxonomía | La base segura lo menciona explícitamente | Verde en la base segura |
| 2026-10-06 | Restricciones declaradas en `implicados`, `porRol`, `pareja` y `audiencia` | Permite validar a todas las personas implicadas, pares concretos y audiencia | El contacto debe declararse en `pareja` (validador) |
| 2026-10-06 | Equilibrio: primero se elige a quién le toca (menos oportunidades, mayor espera, urgencia a los 3 turnos) y luego la carta | Garantiza espera ≤ 3 con opciones compatibles | Probado con 100 semillas × 200 oportunidades |
| 2026-10-06 | «Carta sorpresa» habilita eventos cada 4–7 oportunidades; si es el único juego, la ronda base usa Tarjetas | Una sorpresa es un evento, no un juego continuo | Documentado en Cómo funciona |
| 2026-10-06 | El rechazo de una autorización no consume la oportunidad (se elige otra carta) | «Elegiremos otra actividad» | Máximo 8 cambios/rechazos por oportunidad; después se cierra como pasada |
| 2026-10-06 | Rotación automática entre los juegos seleccionados (el menos usado en cada ronda) | «Uno o varios juegos» sin obligar a cambiar a mano | La cadena se mantiene hasta terminar o salir |
| 2026-10-06 | Noche completa = 60 min con todos los juegos base y sorpresas; apertura/cierre priorizan juegos y tags propios | Mezcla automática explicada al elegirla | Nunca sube de nivel sola |
| 2026-10-06 | Caos = todos los juegos base salvo los desactivados en el asistente | Requisito «salvo los que se deshabiliten expresamente» | — |
| 2026-10-06 | El consentimiento inicial se pide antes de crear la sesión | Así nada se guarda si alguien no acepta | Prueba E2E |
| 2026-10-06 | Restaurar siempre entra en Pausa; autorizaciones y relojes no sobreviven; carta con versión distinta se invalida | Punto seguro | Pruebas de integración |
| 2026-10-06 | Bloqueo de escritor en IndexedDB con TTL 15 s y latido de 5 s; id de pestaña en sessionStorage solo para sesiones normales | Una recarga de la misma pestaña no se bloquea a sí misma; un cierre inesperado caduca | Prueba E2E de dos ventanas |
| 2026-10-06 | Service worker propio generado tras el build (precache de todo `out/`), sin librerías | Compatible con la exportación estática real; no cachea respuestas fuera de la lista | Prueba E2E offline con acceso directo a rutas |
| 2026-10-06 | CSP con `'unsafe-inline'` para scripts y estilos | La exportación estática de Next inserta scripts en línea y no admite nonces sin servidor | `connect-src 'self'`, sin iframes ni orígenes externos |
| 2026-10-06 | Ampliación del catálogo redactada en paralelo por agentes con el mismo validador y metas por familia, y revisada por muestreo | Plan §0.1.10 permite agentes paralelos | 1.000 cartas validadas |
| 2026-10-06 | En Quién me conoce mejor las adivinanzas se muestran con alias | El juego compara conocimiento; no hay respuestas sensibles ni votos | Las respuestas se borran al cerrar la ronda |
| 2026-10-07 | Nombre de marca: **Cómplice** (antes TRIO, provisional) | Decisión de la persona propietaria | Solo cambia el nombre visible (`APP_NAME`, manifest). La base IndexedDB «trio», las claves «trio:» y las cachés «trio-» se conservan para no perder sesiones ni favoritas guardadas |
