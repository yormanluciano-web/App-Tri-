import { defineCards } from "../define";

// Perverso v2 · lente 01: base suave, caricias, besos exploratorios.
// Intensidad 2-3 caricias exploratorias, suavidad, coqueteo.
export const perversoV2_01 = defineCards("perverso", "v2", "suave", [
  { id: "01001", t: "Primer contacto", x: "{p1}, toma la mano de {p2} durante diez segundos, sin decir nada. Después cuéntale cómo se sintió ese primer contacto.", c: "retos", f: "reto", s: 75, i: "directed_pair", pair: ["contacto_manos"], d: [10, 10, 10] },
  { id: "01002", t: "Beso lento", x: "{p1} y {p2}, dense un beso lento de quince segundos. Al separarse, cada quien describe en voz alta qué sintió.", c: "retos", f: "reto", s: 88, i: "directed_pair", pair: ["beso"], d: [15, 10, 20], tags: ["cumplido"] },
  { id: "01003", t: "Caricia favorita", x: "{p1}, ¿dónde te gustan más las caricias: en las manos, en la cintura o en la espalda? Cuenta por qué.", c: "preguntas", f: "pregunta", s: 82, req: ["preguntas_personales"], d: [30, 15, 45] },
  { id: "01004", t: "Toques sin prisa", x: "{p1} y {p2}, durante treinta segundos acaríciense con suavidad, por encima de la ropa, donde cada quien quiera. Al terminar, digan qué caricia les gustó más.", c: "retos", f: "reto", s: 80, i: "directed_pair", pair: ["caricias"], d: [30, 20, 50], tags: ["cumplido"] },
  { id: "01005", t: "Besos exploradores", x: "{p1} y {p2}, durante dos minutos recorran con besos los labios, el cuello y las orejas de la otra persona.", c: "retos", f: "reto", s: 93, i: "directed_pair", pair: ["beso_intenso"], d: [120, 60, 180], tags: ["cumplido"] },
  { id: "01006", t: "Sin juicios", x: "{p2}, con total sinceridad y sin juicios: ¿qué te gustaría que {p1} hiciera contigo esta noche?", c: "preguntas", f: "pregunta", s: 78, req: ["preguntas_personales"], pair: ["coqueteo"], d: [30, 20, 40] },
  { id: "01007", t: "Deseo guardado", x: "{p1}, confía en quienes están aquí: ¿qué deseo has guardado siempre y nunca has dicho? Dilo en voz alta.", c: "rompehielo", f: "pregunta", s: 86, req: ["confesiones"], d: [45, 30, 60], tags: ["cumplido"] },
  { id: "01008", t: "Coqueteo ligero", x: "{p1} y {p2}, díganse un comentario coqueto. Luego confiesen cuál de los dos comentarios les sacó una sonrisa.", c: "rompehielo", f: "pregunta", s: 76, req: ["coqueteo"], d: [30, 20, 40], tags: ["risas"] },
  { id: "01009", t: "Lenguaje sin palabras", x: "{p1}, sin decir una sola palabra, comunica con la mirada y los gestos lo que deseas en este momento.", c: "retos", f: "reto", s: 84, req: ["miradas", "coqueteo"], d: [45, 30, 60], tags: ["calma"] },
  { id: "01010", t: "Riesgo mínimo", x: "{p1}, di la frase más atrevida que te animes a decir sin cruzar tus propios límites.", c: "retos", f: "reto", s: 88, req: ["confesiones"], d: [30, 15, 30] },
  { id: "01011", t: "Canción de la ronda", x: "Elijan juntos una canción para esta ronda. Solo vale si a todos les gusta.", c: "eleccion", f: "reto", s: 74, req: ["musica"] },
  { id: "01012", t: "Beso al compás", x: "{p1} y {p2}, dense un beso suave siguiendo el ritmo de la música, durante veinte segundos o hasta que quieran parar.", c: "retos", f: "reto", s: 85, req: ["musica"], pair: ["beso"], d: [20, 15, 30] },
  { id: "01013", t: "Susurro secreto", x: "{p1}, acércate al oído de {p2} y susúrrale lo primero que se te pase por la cabeza al mirarle.", c: "retos", f: "reto", s: 82, i: "directed_pair", pair: ["coqueteo"], d: [30, 20, 40], tags: ["cumplido"] },
  { id: "01014", t: "Secreto adivinado", x: "{p1}, {p2} y {p3}: voten quién de ustedes adivinaría mejor el secreto más atrevido de los otros dos. Quien gane, que lo intente.", c: "rompehielo", f: "pregunta", s: 80, i: "group", sizes: [3], req: ["adivinanzas"], d: [30, 15, 60] },
  { id: "01015", t: "Lo mejor de la noche", x: "{p1}, ¿qué es lo que más te ha gustado de los juegos de esta noche? Dilo en voz alta.", c: "preguntas", f: "pregunta", s: 87, req: ["preguntas_personales"], d: [30, 20, 40], tags: ["cumplido"] },
  { id: "01016", t: "Una sola palabra", x: "{p1}, mira a {p2} y resume en una sola palabra lo que sientes por esa persona ahora mismo.", c: "preguntas", f: "pregunta", s: 79, req: ["preguntas_personales"], tags: ["cumplido"] },
  { id: "01017", t: "Beso de cierre", x: "Antes de terminar, decidan entre todos: ¿beso dulce o beso intenso? {p1} y {p2} se dan el que gane durante diez segundos.", c: "rompehielo", f: "reto", s: 83, i: "directed_pair", pair: ["beso_intenso"], d: [10, 10, 15] },
  { id: "01018", t: "Lo que me acompaña", x: "{p1}, ¿qué recuerdo de esta noche te acompaña ahora mismo?", c: "preguntas", f: "pregunta", s: 86, req: ["preguntas_personales"], tags: ["cumplido"] },
  { id: "01019", t: "Verdad final", x: "{p1}, una última verdad: esta noche, ¿te gustó más lo suave o lo intenso?", c: "rompehielo", f: "pregunta", s: 81, req: ["preguntas_personales"], d: [30, 15, 30], tags: ["cumplido"] },
]);
