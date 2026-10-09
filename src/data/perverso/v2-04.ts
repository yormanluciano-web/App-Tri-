import { defineCards } from "../define";

// Perverso v2 · lote 04: caricias intensas, contacto táctil gradual, coqueteo físico.
// Intensidad 4-6: caricias sin ropa, contacto breve, roles coqueteo.
export const perversoV2_04 = defineCards("perverso", "v2", "base", [
  { id: "04001", t: "Pregunta especial", x: "{p1}, ¿qué momento te hizo sentir más especial esta noche?", c: "preguntas", f: "pregunta", s: 72, req: ["conversacion_ligera"], d: [30, 15, 60] },
  { id: "04002", t: "Pregunta frase", x: "{p1}, ¿qué frase te gustaría escuchar esta noche.", c: "preguntas", f: "pregunta", s: 68, req: ["coqueteo"] },
  { id: "04003", t: "Pregunta detalle", x: "{p1}, ¿qué detalle de {p2} te atrae más esta noche.", c: "preguntas", f: "pregunta", s: 75, i: "directed_pair", req: ["coqueteo"], pair: ["miradas"] },
  { id: "04004", t: "Pregunta cumplido", x: "{p1}, de {p2}, ¿qué le haría feliz recibirle un cumplido.", c: "preguntas", f: "pregunta", s: 69, i: "directed_pair", req: ["coqueteo"] },
  { id: "04005", t: "Pregunta musica", x: "{p1} y {p2}, ¿qué canción pondrían para una noche intensa.", c: "preguntas", f: "pregunta", s: 71, i: "directed_pair", req: ["musica"], pair: ["coqueteo"], tags: ["voz"] },
  { id: "04006", t: "Pregunta contacto", x: "{p1}, ¿qué prenda de {p2} te gustaría tocar con los ojos cerrados.", c: "preguntas", f: "pregunta", s: 73, i: "directed_pair", req: ["fantasias"], pair: ["contacto_manos"], d: [45, 25, 90] },
  { id: "04007", t: "Pregunta tiempo", x: "{p1}, ¿qué momento te gustaría compartir con {p2} sin interrupciones.", c: "preguntas", f: "pregunta", s: 76, i: "directed_pair", req: ["preguntas_personales"], pair: ["tiempo_a_solas"], d: [180, 90, 270] },
  { id: "04008", t: "Pregunta fantasia", x: "{p1}, ¿qué fantasía te gustaría desarrollar esta noche con {p2}.", c: "preguntas", f: "pregunta", s: 81, i: "directed_pair", req: ["fantasias"], pair: ["coqueteo"] },
  { id: "04009", t: "Pregunta gusto", x: "{p1}, ¿qué te gusta más de {p2}: voz, ojos o toque.", c: "preguntas", f: "pregunta", s: 78, i: "directed_pair", req: ["coqueteo"], pair: ["miradas", "caricias"] },
  { id: "04010", t: "Pregunta probar", x: "{p1}, ¿qué te gustaría probar esta noche con {p2}?", c: "preguntas", f: "pregunta", s: 83, i: "directed_pair", req: ["fantasias"], pair: ["coqueteo"] },
  { id: "04011", t: "Reto caminar", x: "{p1} camina por la habitación 60s sin parar.", c: "retos", f: "reto", s: 67, req: ["baile_individual"], d: [60, 30, 90], tags: ["movimiento"] },
  { id: "04012", t: "Reto cercania", x: "{p1} y {p2}, ¿quién se mantiene más cerca 20s.", c: "retos", f: "reto", s: 70, i: "directed_pair", req: ["coqueteo"], pair: ["caricias"], d: [20, 15, 40], tags: ["cumplido"] },
  { id: "04013", t: "Reto caricia", x: "{p1} y {p2}: dales la mano 30s, dicen secreto, sueltan sin reírse.", c: "retos", f: "reto", s: 82, i: "directed_pair", req: ["coqueteo", "confesiones"], pair: ["contacto_manos"], d: [60, 30, 90], tags: ["risas"] },
  { id: "04014", t: "Reto circulo", x: "{p1}, camina 40s alrededor de {p2}, describiendo qué le gusta.", c: "retos", f: "reto", s: 74, i: "directed_pair", pair: ["coqueteo"], d: [40, 20, 60], tags: ["cumplido"] },
  { id: "04015", t: "Reto miradas", x: "{p1} y {p2}, miradas intensas 1min sin hablar.", c: "retos", f: "reto", s: 72, i: "directed_pair", pair: ["miradas"], d: [60, 30, 90] },
]);
