# Contenido

Recuento real generado con `npm run content:report` (2026-10-07). Catálogo v2 (`CONTENT_VERSION` = 2): todas las actividades están activas y en estado `reviewed`.

```
Total: 1200 · En producción (activas y revisadas): 1200
Estados editoriales: {"reviewed":1200}

## leve — 300
  categorías: {"rompehielo":41,"preguntas":53,"retos":33,"desafios":27,"confianza":10,"conexion":27,"musica":19,"baile":14,"pareja":20,"trio":10,"eleccion":21,"secretos":15,"sorpresa":10}
  formatos:   {"pregunta":102,"reto":153,"secreto":15,"conocimiento":10,"votacion":10,"sorpresa":10}
  juegos:     {"verdad_reto":255,"ruleta":255,"dados":255,"tarjetas":255,"cadena":255,"temporizador":80,"secretos":15,"quien_conoce":10,"mas_probable":10,"sorpresa":10}
  tamaño:     {"2":286,"3":300}
  contacto:   {"contacto":15,"sin_contacto":285}
  familias editoriales (actual / meta):
    Preguntas y rompehielos          80 / 80
    Retos y desafíos                 60 / 60
    Conexión y confianza             35 / 35
    Música y baile                   30 / 30
    Dinámicas de dos y tres          30 / 30
    Elecciones                       20 / 20
    Confesiones y secretos           15 / 15
    Conocimiento y más probable      20 / 20
    Sorpresas                        10 / 10

## picante — 450
  categorías: {"preguntas":67,"rompehielo":24,"retos":62,"desafios":22,"masajes":7,"confianza":19,"conexion":22,"musica":12,"baile":32,"trio":38,"pareja":48,"eleccion":36,"secretos":41,"sorpresa":20}
  formatos:   {"pregunta":121,"reto":252,"secreto":32,"votacion":13,"conocimiento":12,"sorpresa":20}
  juegos:     {"verdad_reto":373,"ruleta":373,"dados":373,"tarjetas":373,"cadena":373,"temporizador":128,"secretos":32,"mas_probable":13,"quien_conoce":12,"sorpresa":20}
  tamaño:     {"2":385,"3":450}
  contacto:   {"contacto":108,"sin_contacto":342}
  familias editoriales (actual / meta):
    Preguntas y rompehielos          80 / 80
    Retos y desafíos                 90 / 90
    Conexión y confianza             40 / 40
    Música y baile                   40 / 40
    Dinámicas de dos y tres          80 / 80
    Elecciones                       35 / 35
    Confesiones y secretos           40 / 40
    Conocimiento y más probable      25 / 25
    Sorpresas                        20 / 20

## perverso — 450
  categorías: {"preguntas":46,"rompehielo":18,"retos":60,"desafios":40,"masajes":5,"confianza":16,"conexion":17,"baile":22,"musica":9,"eleccion":44,"pareja":51,"trio":43,"secretos":59,"sorpresa":20}
  formatos:   {"pregunta":103,"reto":277,"secreto":25,"votacion":13,"conocimiento":12,"sorpresa":20}
  juegos:     {"verdad_reto":380,"ruleta":380,"dados":380,"tarjetas":380,"cadena":380,"temporizador":150,"secretos":25,"mas_probable":13,"quien_conoce":12,"sorpresa":20}
  tamaño:     {"2":354,"3":450}
  contacto:   {"contacto":114,"sin_contacto":336}
  familias editoriales (actual / meta):
    Preguntas y rompehielos          60 / 60
    Retos y desafíos                100 / 100
    Conexión y confianza             30 / 30
    Música y baile                   30 / 30
    Dinámicas de dos y tres          90 / 90
    Elecciones                       40 / 40
    Confesiones y secretos           55 / 55
    Conocimiento y más probable      25 / 25
    Sorpresas                        20 / 20
```

## Estado editorial
- **1.200 actividades**: 300 Leve, 450 Picante, 450 Perverso, con la distribución por familia de `EDITORIAL_TARGETS`.
- Tono más atrevido a petición de la propietaria: besos (incluidos intensos), caricias sobre la ropa, bailes sensuales, prendas y tiempo a solas, siempre con permisos y confirmación privada.
- Línea que no se cruza: nada sexualmente explícito (sin actos sexuales, genitales, senos, nalgas, desnudez ni ropa interior). El validador veta esos términos y las cartas de prendas y de tiempo a solas muestran avisos automáticos.
- Validador: 0 errores y 0 avisos, también con `--similar`.
- Leve conserva más de 150 cartas que solo requieren la base segura, para quien elige «No acepto».

## Reglas para añadir cartas
1. Crear `src/data/<nivel>/v2-NN.ts` con `defineCards` e IDs nuevos (nunca reciclar).
2. Declarar permisos honestos: contacto, besos y tiempo a solas solo en `pair`; besos, besos intensos y tiempo a solas con `conf: true`; prendas en `req`/`rol` y en `aud` con `audScope: "sesion"`.
3. Registrar el lote en `src/data/<nivel>/index.ts`.
4. `npm run content:validate -- --similar` y `npm run test`.
5. Si cambia el texto o metadatos de una carta existente, subir `CONTENT_VERSION` en `src/data/catalog.ts`.
