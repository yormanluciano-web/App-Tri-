# Estado

**Fase actual:** publicado en Vercel por la propietaria. Catálogo v2, semáforo simplificado, rediseño 3D modo demo y género con cartas «solo hombre y mujer» (v0.8.0) completados.

**Último resultado verificado (2026-10-09, v1.12.5: cartas de Perverso reescritas y audio que se suelta en silencio):**
- `npm run typecheck` y `npm run lint`: sin errores.
- `npm run content:validate`: 933 actividades, 0 errores, 4 avisos (falsos positivos de contacto en cartas que solo hablan).
- `npm test`: 148 pruebas en verde.
- `npm run build`: exportación estática + `sw.js` con 91 recursos.
- `npm run test:e2e`: 55 pruebas en verde (incluidas la demo, el panel, «Probar», la música, los minijuegos con el Parqués, los efectos de sonido y que todo quepa en la pantalla) en Chromium (móvil).

**Siguiente acción concreta:** crear la llave de GitHub y probar el panel de administración (docs/DESPLIEGUE.md); verificar el despliegue nuevo en Vercel y probar en el iPhone (las sesiones guardadas con el catálogo anterior reemplazan su carta actual de forma segura).
