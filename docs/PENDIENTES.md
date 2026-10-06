# Pendientes

| Prioridad | Trabajo | Estado |
|---|---|---|
| Alta | Publicar en Vercel e indicar la URL | **Bloqueado**: requiere que la persona propietaria importe el repo en su cuenta (no hay acceso a Vercel desde este entorno) |
| Alta | Prueba manual en iPhone físico (Safari, Añadir a pantalla de inicio, modo avión) | Pendiente de dispositivo |
| Media | Pruebas automatizadas en WebKit | No disponible en este entorno (solo Chromium instalado); la CI puede añadir `npx playwright install webkit` |
| Media | Verificar cabeceras CSP en la URL real de Vercel (ya probadas en `preview`) | Tras publicar |
| Baja | Elegir nombre de marca definitivo (TRIO es provisional, centralizado en `APP_NAME`) | Decisión de negocio |
| Baja | Panel editorial, paquetes premium y sincronización (Supabase) | Fuera de la primera versión; ver `docs/EVOLUCION.md` |
