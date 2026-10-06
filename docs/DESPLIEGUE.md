# Despliegue

## Estado
| Elemento | Valor |
|---|---|
| Repositorio | `github.com/yormanluciano-web/App-Tri-` (rama de trabajo `claude/hola-mwq2zq`) |
| Hosting | Vercel (pendiente: requiere que la persona propietaria importe el repositorio) |
| URL | Pendiente: la genera Vercel (`*.vercel.app`). No se compró dominio. |

Este entorno no tiene acceso a una cuenta de Vercel, así que **no se ha publicado**. Todo lo demás está verificado localmente con el build de producción.

## Publicar en Vercel (una sola vez)
1. Entrar en https://vercel.com/new con la cuenta de GitHub.
2. Importar `yormanluciano-web/App-Tri-`.
3. Vercel lee `vercel.json`: instalación `npm ci`, build `npm run build`, salida `out`, sin framework (sitio estático) y con las cabeceras de seguridad. No hace falta configurar variables de entorno ni secretos.
4. Node: 22.x (Settings → General → Node.js Version) para coincidir con `.nvmrc`.
5. Elegir la rama de producción (`main` tras fusionar, o `claude/hola-mwq2zq`).
6. Al terminar, abrir la URL `https://<proyecto>.vercel.app`, comprobar inicio, crear una sesión, y en Ajustes que aparece «Disponible sin conexión».

Los despliegues de vista previa de otras ramas también son públicos para quien tenga la URL; no son privados por ser «preview». Una URL poco difundida o `noindex` no es control de acceso.

## Ejecución local
```bash
nvm use            # Node 22
npm ci
npm run dev        # http://localhost:3000 (sin service worker)
npm run build      # valida catálogo, exporta a out/ y genera out/sw.js
npm run preview    # http://localhost:4173, build de producción con las cabeceras de vercel.json
```
Una IP de red local por HTTP no es un origen válido para probar la instalación PWA: usa la URL HTTPS de Vercel en el teléfono.

## Instalar en iPhone
1. Abrir la URL en **Safari**.
2. Esperar en el inicio el indicador **«Disponible sin conexión»**.
3. Tocar **Compartir** → **Añadir a pantalla de inicio**.
4. Si aparece **«Abrir como app web»**, activarlo y confirmar **Añadir**.
5. Abrir TRIO desde el icono y crear una sesión de prueba.
6. Con el modo avión activado, abrir de nuevo TRIO y comprobar que funciona.

Los nombres exactos pueden variar con la versión de iOS. No se necesita App Store ni perfil de desarrollador.

## Actualizar
1. Editar contenido o código.
2. `npm run content:validate && npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e`.
3. Commit y push: Vercel despliega el commit automáticamente.
4. Verificar en Vercel que el despliegue corresponde al commit probado.
5. En la app, la actualización se ofrece en Pausa, al terminar o en Ajustes; nunca recarga en mitad de una actividad. El service worker conserva la versión anterior para pestañas abiertas.

## Volver a una versión anterior
En Vercel → Deployments → elegir el despliegue anterior → **Promote to Production** (o «Instant Rollback»). Revertir código no revierte datos guardados en los teléfonos: los cambios de esquema deben ser compatibles hacia atrás o subir `SCHEMA_VERSION`, en cuyo caso las sesiones guardadas incompatibles se ofrecen para eliminar, nunca se reinterpretan.

## Cambiar de dominio
El almacenamiento local pertenece al origen: al cambiar de dominio las sesiones guardadas y favoritas no se trasladan.
