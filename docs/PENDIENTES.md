# Pendientes

| Prioridad | Trabajo | Estado |
|---|---|---|
| Alta | Publicar en Vercel e indicar la URL | **Bloqueado**: requiere que la persona propietaria importe el repo en su cuenta (no hay acceso a Vercel desde este entorno) |
| Alta | Prueba manual en iPhone físico (Safari, Añadir a pantalla de inicio, modo avión) | Pendiente de dispositivo |
| Media | Pruebas automatizadas en WebKit | No disponible en este entorno (solo Chromium instalado); la CI puede añadir `npx playwright install webkit` |
| Media | Verificar cabeceras CSP en la URL real de Vercel (ya probadas en `preview`) | Tras publicar |
| Alta | Panel de administración dentro de la app (registrarse, agregar/editar/borrar cartas que se guarden en el repositorio) | **Esperando decisión**: escribir en GitHub desde la app fue bloqueado por el control de permisos de la sesión. Ya existen el formato `cartas.json`, el armado de cartas y la validación; falta la conexión. Mientras tanto se edita `src/data/custom/cartas.json` desde la web de GitHub |
| Hecho | Nombre de marca definitivo: Cómplice | 2026-10-07 |
| Baja | Panel editorial, paquetes premium y sincronización (Supabase) | Fuera de la primera versión; ver `docs/EVOLUCION.md` |
