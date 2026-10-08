# Contenido

Recuento real generado con `npm run content:report` (2026-10-08). Catálogo v2 (`CONTENT_VERSION` = 2): todas las actividades están activas y en estado `reviewed`.

```
Total: 1109 · En producción (activas y revisadas): 1109
Estados editoriales: {"reviewed":1109}

## leve — 296
  categorías: {"rompehielo":38,"preguntas":46,"retos":33,"desafios":27,"confianza":10,"conexion":26,"musica":18,"baile":13,"pareja":20,"trio":10,"eleccion":20,"sorpresa":10,"secretos":25}
  formatos:   {"pregunta":129,"reto":157,"sorpresa":10}
  juegos:     {"verdad_reto":286,"ruleta":286,"dados":286,"tarjetas":286,"cadena":286,"temporizador":82,"sorpresa":10}
  tamaño:     {"2":281,"3":296}
  contacto:   {"contacto":15,"sin_contacto":281}
  solo hombre y mujer: 6
  familias editoriales (actual / meta):
    Preguntas y rompehielos          84 / 84
    Retos y desafíos                 60 / 60
    Conexión y confianza             36 / 36
    Música y baile                   31 / 31
    Dinámicas de dos y tres          30 / 30
    Elecciones                       20 / 20
    Confesiones y secretos           25 / 25
    Sorpresas                        10 / 10

## picante — 403
  categorías: {"preguntas":58,"rompehielo":24,"retos":66,"desafios":22,"masajes":7,"confianza":19,"conexion":22,"musica":11,"baile":31,"trio":38,"pareja":42,"eleccion":35,"secretos":8,"sorpresa":20}
  formatos:   {"pregunta":124,"reto":259,"sorpresa":20}
  juegos:     {"verdad_reto":383,"ruleta":383,"dados":383,"tarjetas":383,"cadena":383,"temporizador":132,"sorpresa":20}
  tamaño:     {"2":338,"3":403}
  contacto:   {"contacto":113,"sin_contacto":290}
  solo hombre y mujer: 10
  familias editoriales (actual / meta):
    Preguntas y rompehielos          82 / 82
    Retos y desafíos                 95 / 95
    Conexión y confianza             41 / 41
    Música y baile                   42 / 42
    Dinámicas de dos y tres          80 / 80
    Elecciones                       35 / 35
    Confesiones y secretos            8 / 8
    Sorpresas                        20 / 20

## perverso — 410
  categorías: {"preguntas":42,"rompehielo":18,"retos":64,"desafios":39,"masajes":5,"confianza":14,"conexion":16,"baile":23,"musica":8,"eleccion":40,"pareja":47,"trio":43,"secretos":31,"sorpresa":20}
  formatos:   {"pregunta":104,"reto":286,"sorpresa":20}
  juegos:     {"verdad_reto":390,"ruleta":390,"dados":390,"tarjetas":390,"cadena":390,"temporizador":155,"sorpresa":20}
  tamaño:     {"2":319,"3":410}
  contacto:   {"contacto":120,"sin_contacto":290}
  solo hombre y mujer: 10
  familias editoriales (actual / meta):
    Preguntas y rompehielos          60 / 60
    Retos y desafíos                108 / 108
    Conexión y confianza             30 / 30
    Música y baile                   31 / 31
    Dinámicas de dos y tres          90 / 90
    Elecciones                       40 / 40
    Confesiones y secretos           31 / 31
    Sorpresas                        20 / 20
```

## Estado editorial
- **1.109 actividades**: 296 Leve, 403 Picante, 410 Perverso. El 2026-10-08 se añadieron 26 cartas «solo hombre y mujer» (`mixta: true`): 6 Leve, 10 Picante, 10 Perverso.
- Antes: 1.083 actividades (290 Leve, 393 Picante, 400 Perverso). El 2026-10-07 se retiraron las votaciones (36), «¿Quién me conoce mejor?» (34) y «Secretos» (72), porque pedían pasar el teléfono. Se añadieron 25 confesiones en voz alta para Leve.
- Tono más atrevido a petición de la propietaria: besos (incluidos intensos), caricias sobre la ropa, bailes sensuales, prendas y tiempo a solas, siempre con permisos y confirmación privada.
- Línea que no se cruza: nada sexualmente explícito (sin actos sexuales, genitales, senos, nalgas, desnudez ni ropa interior). El validador veta esos términos y las cartas de prendas y de tiempo a solas muestran avisos automáticos.
- Validador: 0 errores y 0 avisos, también con `--similar`.
- Leve conserva más de 150 cartas que solo requieren la base segura, para quien elige «No acepto».

## Reglas para añadir cartas
1. Crear `src/data/<nivel>/v2-NN.ts` con `defineCards` e IDs nuevos (nunca reciclar).
2. Declarar permisos honestos: contacto, besos y tiempo a solas solo en `pair` (sin `conf`: lo aceptado al inicio no se vuelve a preguntar); prendas en `req`/`rol` y en `aud` con `audScope: "sesion"`.
3. Para una carta que solo debe salir entre **un hombre y una mujer** (en cualquier orden), añade `mixta: true`. Debe ser de pareja: usar `{p1}` y `{p2}` en el texto. El motor nunca la asigna a dos hombres, a dos mujeres ni a alguien sin género registrado; en un trío elige la pareja mixta compatible. Ejemplo:
   ```ts
   { id: "461", t: "Título", x: "{p1}, … a {p2} …", c: "retos", f: "reto", s: 50, i: "directed_pair", pair: ["beso"], mixta: true },
   ```
4. Registrar el lote en `src/data/<nivel>/index.ts`.
5. `npm run content:validate -- --similar` y `npm run test`.
6. Si cambia el texto o metadatos de una carta existente, subir `CONTENT_VERSION` en `src/data/catalog.ts`.
