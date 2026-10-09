# Estado

**Fase actual:** publicado en Vercel por la propietaria. Catálogo v2, semáforo simplificado, rediseño 3D modo demo y género con cartas «solo hombre y mujer» (v0.8.0) completados.

**Último resultado verificado (2026-10-09, v1.12.0 con las cartas de Perverso reescritas):**
- `npm run typecheck` y `npm run lint`: sin errores.
- `npm run content:validate -- --similar`: 936 actividades, 0 errores, 3 avisos (falsos positivos de contacto en cartas que solo hablan).
- `npm test`: 143 pruebas en verde.
- `npm run build`: exportación estática + `sw.js` con 91 recursos.
- `npm run test:e2e`: no se ejecutó en esta versión (falta el navegador de Playwright en el equipo); última vez en verde: 54 pruebas (2026-10-08).

**Siguiente acción concreta:** crear la llave de GitHub y probar el panel de administración (docs/DESPLIEGUE.md); verificar el despliegue nuevo en Vercel y probar en el iPhone (las sesiones guardadas con el catálogo anterior reemplazan su carta actual de forma segura).
