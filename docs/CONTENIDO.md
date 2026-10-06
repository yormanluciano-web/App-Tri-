# Contenido

Recuento real generado con `npm run content:report` (2026-10-06). Todas las actividades están activas y en estado `reviewed`.

```
Total: 1000 · En producción (activas y revisadas): 1000
Estados editoriales: {"reviewed":1000}

## leve — 350
  categorías: {"musica":29,"rompehielo":49,"preguntas":55,"conexion":36,"confianza":15,"eleccion":31,"retos":34,"baile":15,"desafios":31,"pareja":18,"secretos":15,"sorpresa":10,"trio":12}
  formatos:   {"pregunta":125,"reto":165,"votacion":19,"conocimiento":16,"secreto":15,"sorpresa":10}
  juegos:     {"verdad_reto":290,"ruleta":290,"dados":290,"tarjetas":290,"cadena":290,"temporizador":103,"mas_probable":19,"quien_conoce":16,"secretos":15,"sorpresa":10}
  tamaño:     {"2":334,"3":350}
  contacto:   {"contacto":8,"sin_contacto":342}
  familias editoriales (actual / meta):
    Preguntas y rompehielos          85 / 85
    Retos y desafíos                 65 / 65
    Conexión y confianza             45 / 45
    Música y baile                   40 / 40
    Dinámicas de dos y tres          30 / 30
    Elecciones                       25 / 25
    Confesiones y secretos           15 / 15
    Conocimiento y más probable      35 / 35
    Sorpresas                        10 / 10

## picante — 350
  categorías: {"preguntas":54,"musica":20,"confianza":18,"eleccion":33,"pareja":35,"conexion":27,"baile":18,"retos":28,"masajes":14,"desafios":23,"trio":17,"secretos":35,"sorpresa":20,"rompehielo":8}
  formatos:   {"pregunta":117,"reto":158,"votacion":14,"conocimiento":16,"secreto":25,"sorpresa":20}
  juegos:     {"verdad_reto":275,"ruleta":275,"dados":275,"tarjetas":275,"cadena":275,"temporizador":82,"mas_probable":14,"quien_conoce":16,"secretos":25,"sorpresa":20}
  tamaño:     {"2":329,"3":350}
  contacto:   {"contacto":50,"sin_contacto":300}
  familias editoriales (actual / meta):
    Preguntas y rompehielos          55 / 55
    Retos y desafíos                 65 / 65
    Conexión y confianza             40 / 40
    Música y baile                   30 / 30
    Dinámicas de dos y tres          45 / 45
    Elecciones                       30 / 30
    Confesiones y secretos           35 / 35
    Conocimiento y más probable      30 / 30
    Sorpresas                        20 / 20

## perverso — 300
  categorías: {"confianza":15,"preguntas":29,"secretos":48,"pareja":33,"conexion":23,"musica":12,"eleccion":33,"retos":20,"desafios":26,"masajes":9,"baile":10,"trio":15,"sorpresa":20,"rompehielo":7}
  formatos:   {"pregunta":75,"reto":159,"votacion":10,"conocimiento":10,"secreto":26,"sorpresa":20}
  juegos:     {"verdad_reto":234,"ruleta":234,"dados":234,"tarjetas":234,"cadena":234,"temporizador":102,"mas_probable":10,"quien_conoce":10,"secretos":26,"sorpresa":20}
  tamaño:     {"2":254,"3":300}
  contacto:   {"contacto":38,"sin_contacto":262}
  familias editoriales (actual / meta):
    Preguntas y rompehielos          30 / 30
    Retos y desafíos                 55 / 55
    Conexión y confianza             35 / 35
    Música y baile                   20 / 20
    Dinámicas de dos y tres          45 / 45
    Elecciones                       30 / 30
    Confesiones y secretos           45 / 45
    Conocimiento y más probable      20 / 20
    Sorpresas                        20 / 20
```

## Estado editorial
- Meta de lanzamiento alcanzada: **1.000 actividades** (350 Leve, 350 Picante, 300 Perverso), con la distribución por familia del plan.
- Validador: 0 errores. 1 aviso revisado manualmente: `v-056` menciona «beso» como lugar del mundo deseado en un secreto escrito; no implica contacto (falso positivo).
- Variantes semánticas comparten `familyId`; el validador sugiere similares por nivel (`npm run content:validate -- --similar`).
- Redacción por lotes de ~50, revisión semántica además de la alerta por palabras clave.

## Reglas para añadir cartas
1. Crear `src/data/<nivel>/extra-NN.ts` con `defineCards` e IDs nuevos (nunca reciclar).
2. Declarar permisos honestos: contacto solo en `pair`; besos con `conf: true`.
3. Registrar el lote en `src/data/<nivel>/index.ts`.
4. `npm run content:validate -- --similar` y `npm run test`.
5. Si cambia el texto o metadatos de una carta existente, subir `CONTENT_VERSION` en `src/data/catalog.ts`.
