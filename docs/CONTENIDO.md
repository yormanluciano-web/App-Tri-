# Contenido

Recuento real generado con `npm run content:report` (2026-10-07). Catálogo v2 (`CONTENT_VERSION` = 2): todas las actividades están activas y en estado `reviewed`.

```
Total: 1058 · En producción (activas y revisadas): 1058
Estados editoriales: {"reviewed":1058}

## leve — 265
  categorías: {"rompehielo":37,"preguntas":43,"retos":33,"desafios":27,"confianza":10,"conexion":25,"musica":17,"baile":13,"pareja":20,"trio":10,"eleccion":20,"sorpresa":10}
  formatos:   {"pregunta":102,"reto":153,"sorpresa":10}
  juegos:     {"verdad_reto":255,"ruleta":255,"dados":255,"tarjetas":255,"cadena":255,"temporizador":80,"sorpresa":10}
  tamaño:     {"2":251,"3":265}
  contacto:   {"contacto":15,"sin_contacto":250}
  familias editoriales (actual / meta):
    Preguntas y rompehielos          80 / 80
    Retos y desafíos                 60 / 60
    Conexión y confianza             35 / 35
    Música y baile                   30 / 30
    Dinámicas de dos y tres          30 / 30
    Elecciones                       20 / 20
    Confesiones y secretos            0 / 0
    Sorpresas                        10 / 10

## picante — 393
  categorías: {"preguntas":56,"rompehielo":24,"retos":61,"desafios":22,"masajes":7,"confianza":19,"conexion":21,"musica":11,"baile":29,"trio":38,"pareja":42,"eleccion":35,"secretos":8,"sorpresa":20}
  formatos:   {"pregunta":121,"reto":252,"sorpresa":20}
  juegos:     {"verdad_reto":373,"ruleta":373,"dados":373,"tarjetas":373,"cadena":373,"temporizador":128,"sorpresa":20}
  tamaño:     {"2":328,"3":393}
  contacto:   {"contacto":108,"sin_contacto":285}
  familias editoriales (actual / meta):
    Preguntas y rompehielos          80 / 80
    Retos y desafíos                 90 / 90
    Conexión y confianza             40 / 40
    Música y baile                   40 / 40
    Dinámicas de dos y tres          80 / 80
    Elecciones                       35 / 35
    Confesiones y secretos            8 / 8
    Sorpresas                        20 / 20

## perverso — 400
  categorías: {"preguntas":42,"rompehielo":18,"retos":56,"desafios":39,"masajes":5,"confianza":14,"conexion":16,"baile":22,"musica":8,"eleccion":40,"pareja":47,"trio":43,"secretos":30,"sorpresa":20}
  formatos:   {"pregunta":103,"reto":277,"sorpresa":20}
  juegos:     {"verdad_reto":380,"ruleta":380,"dados":380,"tarjetas":380,"cadena":380,"temporizador":150,"sorpresa":20}
  tamaño:     {"2":310,"3":400}
  contacto:   {"contacto":114,"sin_contacto":286}
  familias editoriales (actual / meta):
    Preguntas y rompehielos          60 / 60
    Retos y desafíos                100 / 100
    Conexión y confianza             30 / 30
    Música y baile                   30 / 30
    Dinámicas de dos y tres          90 / 90
    Elecciones                       40 / 40
    Confesiones y secretos           30 / 30
    Sorpresas                        20 / 20
```

## Estado editorial
- **1.058 actividades**: 265 Leve, 393 Picante, 400 Perverso. El 2026-10-07 se retiraron las votaciones (36), «¿Quién me conoce mejor?» (34) y «Secretos» (72), porque pedían pasar el teléfono.
- Tono más atrevido a petición de la propietaria: besos (incluidos intensos), caricias sobre la ropa, bailes sensuales, prendas y tiempo a solas, siempre con permisos y confirmación privada.
- Línea que no se cruza: nada sexualmente explícito (sin actos sexuales, genitales, senos, nalgas, desnudez ni ropa interior). El validador veta esos términos y las cartas de prendas y de tiempo a solas muestran avisos automáticos.
- Validador: 0 errores y 0 avisos, también con `--similar`.
- Leve conserva más de 150 cartas que solo requieren la base segura, para quien elige «No acepto».

## Reglas para añadir cartas
1. Crear `src/data/<nivel>/v2-NN.ts` con `defineCards` e IDs nuevos (nunca reciclar).
2. Declarar permisos honestos: contacto, besos y tiempo a solas solo en `pair` (sin `conf`: lo aceptado al inicio no se vuelve a preguntar); prendas en `req`/`rol` y en `aud` con `audScope: "sesion"`.
3. Registrar el lote en `src/data/<nivel>/index.ts`.
4. `npm run content:validate -- --similar` y `npm run test`.
5. Si cambia el texto o metadatos de una carta existente, subir `CONTENT_VERSION` en `src/data/catalog.ts`.
