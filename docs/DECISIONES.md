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
