# Contenido

Recuento real generado con `npm run content:report` (2026-10-07). Catálogo v2 (`CONTENT_VERSION` = 2): todas las actividades están activas y en estado `reviewed`.

```
Total: 1164 · En producción (activas y revisadas): 1164
Estados editoriales: {"reviewed":1164}

## leve — 290
  categorías: {"rompehielo":37,"preguntas":50,"retos":33,"desafios":27,"confianza":10,"conexion":26,"musica":18,"baile":13,"pareja":20,"trio":10,"eleccion":21,"secretos":15,"sorpresa":10}
  formatos:   {"pregunta":102,"reto":153,"secreto":15,"conocimiento":10,"sorpresa":10}
  juegos:     {"verdad_reto":255,"ruleta":255,"dados":255,"tarjetas":255,"cadena":255,"temporizador":80,"secretos":15,"quien_conoce":10,"sorpresa":10}
  tamaño:     {"2":276,"3":290}
  contacto:   {"contacto":15,"sin_contacto":275}
  familias editoriales (actual / meta):
    Preguntas y rompehielos          80 / 80
    Retos y desafíos                 60 / 60
    Conexión y confianza             35 / 35
    Música y baile                   30 / 30
    Dinámicas de dos y tres          30 / 30
    Elecciones                       20 / 20
    Confesiones y secretos           15 / 15
    Quién me conoce                  10 / 10
    Sorpresas                        10 / 10

## picante — 437
  categorías: {"preguntas":62,"rompehielo":24,"retos":61,"desafios":22,"masajes":7,"confianza":19,"conexion":22,"musica":12,"baile":29,"trio":38,"pareja":46,"eleccion":35,"secretos":40,"sorpresa":20}
  formatos:   {"pregunta":121,"reto":252,"secreto":32,"conocimiento":12,"sorpresa":20}
  juegos:     {"verdad_reto":373,"ruleta":373,"dados":373,"tarjetas":373,"cadena":373,"temporizador":128,"secretos":32,"quien_conoce":12,"sorpresa":20}
  tamaño:     {"2":372,"3":437}
  contacto:   {"contacto":108,"sin_contacto":329}
  familias editoriales (actual / meta):
    Preguntas y rompehielos          80 / 80
    Retos y desafíos                 90 / 90
    Conexión y confianza             40 / 40
    Música y baile                   40 / 40
    Dinámicas de dos y tres          80 / 80
    Elecciones                       35 / 35
    Confesiones y secretos           40 / 40
    Quién me conoce                  12 / 12
    Sorpresas                        20 / 20

## perverso — 437
  categorías: {"preguntas":44,"rompehielo":18,"retos":57,"desafios":40,"masajes":5,"confianza":16,"conexion":16,"baile":22,"musica":9,"eleccion":43,"pareja":48,"trio":43,"secretos":56,"sorpresa":20}
  formatos:   {"pregunta":103,"reto":277,"secreto":25,"conocimiento":12,"sorpresa":20}
  juegos:     {"verdad_reto":380,"ruleta":380,"dados":380,"tarjetas":380,"cadena":380,"temporizador":150,"secretos":25,"quien_conoce":12,"sorpresa":20}
  tamaño:     {"2":341,"3":437}
  contacto:   {"contacto":114,"sin_contacto":323}
  familias editoriales (actual / meta):
    Preguntas y rompehielos          60 / 60
    Retos y desafíos                100 / 100
    Conexión y confianza             30 / 30
    Música y baile                   30 / 30
    Dinámicas de dos y tres          90 / 90
    Elecciones                       40 / 40
    Confesiones y secretos           55 / 55
    Quién me conoce                  12 / 12
    Sorpresas                        20 / 20
```

## Estado editorial
- **1.164 actividades**: 290 Leve, 437 Picante, 437 Perverso (se retiraron las 36 votaciones de «¿Quién es más probable?» el 2026-10-07).
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
