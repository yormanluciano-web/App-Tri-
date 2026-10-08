# Estado

**Fase actual:** publicado en Vercel por la propietaria. Catálogo v2, semáforo simplificado, rediseño 3D modo demo y género con cartas «solo hombre y mujer» (v0.8.0) completados.

**Último resultado verificado (2026-10-08):**
- `npm run typecheck` y `npm run lint`: sin errores.
- `npm run content:validate -- --similar`: 1.109 actividades, 0 errores, 0 avisos.
- `npm test`: 100 pruebas en verde.
- `npm run build`: exportación estática + `sw.js` con 65 recursos.
- `npm run test:e2e`: 39 pruebas en verde (incluidas la demo, el panel, «Probar», la música y los minijuegos) en Chromium (móvil).

**Siguiente acción concreta:** crear la llave de GitHub y probar el panel de administración (docs/DESPLIEGUE.md); verificar el despliegue nuevo en Vercel y probar en el iPhone (las sesiones guardadas con el catálogo anterior reemplazan su carta actual de forma segura).
