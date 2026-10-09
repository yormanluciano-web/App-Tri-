import { defineCards } from "../define";

// Perverso v2 · lote 04: caricias intensas, contacto táctil gradual, coqueteo físico.
// Intensidad 4-6: caricias sin ropa, contacto breve, roles coqueteo.
export const perversoV2_04 = defineCards("perverso", "v2", "base", [
  { id: "04001", t: "Momento especial", x: "{p1}, ¿en qué momento de esta noche te has sentido más especial?", c: "preguntas", f: "pregunta", s: 72, req: ["conversacion_ligera"], d: [30, 15, 60] },
  { id: "04002", t: "Frase deseada", x: "{p1}, ¿qué frase te gustaría que te dijeran al oído esta noche?", c: "preguntas", f: "pregunta", s: 68, req: ["coqueteo"] },
  { id: "04003", t: "Lo que me atrae de ti", x: "{p1}, mira a {p2}: ¿qué detalle suyo te atrae más esta noche?", c: "preguntas", f: "pregunta", s: 75, i: "directed_pair", req: ["coqueteo"], pair: ["miradas"] },
  { id: "04004", t: "El cumplido perfecto", x: "{p1}, ¿qué cumplido crees que haría más feliz a {p2}? Díselo ahora.", c: "preguntas", f: "pregunta", s: 69, i: "directed_pair", req: ["coqueteo"] },
  { id: "04005", t: "Banda sonora", x: "{p1} y {p2}, ¿qué canción pondrían de fondo en una noche intensa? Pónganse de acuerdo.", c: "preguntas", f: "pregunta", s: 71, i: "directed_pair", req: ["musica"], pair: ["coqueteo"], tags: ["voz"] },
  { id: "04006", t: "Prenda al tacto", x: "{p1}, ¿qué prenda de {p2} te gustaría tocar con los ojos cerrados? Explica por qué.", c: "preguntas", f: "pregunta", s: 73, i: "directed_pair", req: ["fantasias"], pair: ["contacto_manos"], d: [45, 25, 90] },
  { id: "04007", t: "Sin interrupciones", x: "{p1}, ¿qué momento te gustaría compartir con {p2} sin que nadie les interrumpa?", c: "preguntas", f: "pregunta", s: 76, i: "directed_pair", req: ["preguntas_personales"], pair: ["tiempo_a_solas"], d: [180, 90, 270] },
  { id: "04008", t: "Fantasía compartida", x: "{p1}, ¿qué fantasía te gustaría vivir esta noche con {p2}? Cuéntala sin detalles explícitos.", c: "preguntas", f: "pregunta", s: 81, i: "directed_pair", req: ["fantasias"], pair: ["coqueteo"] },
  { id: "04009", t: "Voz, ojos o tacto", x: "{p1}, ¿qué te gusta más de {p2}: su voz, sus ojos o su forma de tocar?", c: "preguntas", f: "pregunta", s: 78, i: "directed_pair", req: ["coqueteo"], pair: ["miradas", "caricias"] },
  { id: "04010", t: "Algo por probar", x: "{p1}, ¿qué te gustaría probar esta noche con {p2}?", c: "preguntas", f: "pregunta", s: 83, i: "directed_pair", req: ["fantasias"], pair: ["coqueteo"] },
  { id: "04011", t: "Paseo sin pausa", x: "{p1}, camina por la habitación durante un minuto sin detenerte, sintiendo todas las miradas sobre ti.", c: "retos", f: "reto", s: 67, req: ["baile_individual"], d: [60, 30, 90], tags: ["movimiento"] },
  { id: "04012", t: "Cada vez más cerca", x: "{p1} y {p2}, acérquense poco a poco durante veinte segundos. ¿Quién aguanta más cerca sin apartarse?", c: "retos", f: "reto", s: 70, i: "directed_pair", req: ["coqueteo"], pair: ["caricias"], d: [20, 15, 40], tags: ["cumplido"] },
  { id: "04013", t: "Manos y secretos", x: "{p1} y {p2}, tómense de las manos y cuéntense un secreto. Si alguien se ríe antes de soltarse, pierde.", c: "retos", f: "reto", s: 82, i: "directed_pair", req: ["coqueteo", "confesiones"], pair: ["contacto_manos"], d: [60, 30, 90], tags: ["risas"] },
  { id: "04014", t: "Círculo de cumplidos", x: "{p1}, camina alrededor de {p2} durante cuarenta segundos mientras describes lo que te gusta de esa persona.", c: "retos", f: "reto", s: 74, i: "directed_pair", pair: ["coqueteo"], d: [40, 20, 60], tags: ["cumplido"] },
  { id: "04015", t: "Miradas sin palabras", x: "{p1} y {p2}, sostengan una mirada intensa durante un minuto, sin decir nada.", c: "retos", f: "reto", s: 72, i: "directed_pair", pair: ["miradas"], d: [60, 30, 90] },
]);
